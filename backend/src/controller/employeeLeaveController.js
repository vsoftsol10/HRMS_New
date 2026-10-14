  
  // employeeLeaveController.js

  import supabase from "../config/supabase.js";
  import { createNotification } from "../services/notificationService.js";
  import { initializeLeaveBalance } from "../services/leaveBalanceService.js";
  import { uploadImageToCloudinary } from "../services/cloudinaryService.js";
  import { safeErrorMessage } from "../utils/httpError.js";

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  // ======================================================
  // GET EMPLOYEE LEAVES
  // ======================================================

  export const getEmployeeLeaves = async (req, res) => {
    try {
      const employeeId = req.user.employee_id;
      const year = Number(req.query.year) || getCurrentYear();

      console.log("Employee ID:", employeeId);
      console.log("Leave Year:", year);

      // --------------------------------------------------
      // Get leave historys
      // --------------------------------------------------

      const {
        data: leaveHistory,
        error: leaveError,
      } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", employeeId)
        .order("applied_at", { ascending: false });

      if (leaveError) {
        throw leaveError;
      }

      // --------------------------------------------------
      // Get employee leave balance
      // --------------------------------------------------

      let {
        data: leaveBalance,
        error: balanceError,
      } = await supabase
        .from("leave_balance")
        .select(`
          id,
          employee_id,
          casual_leave,
          sick_leave,
          earned_leave,
          lop,
          year,
          created_at,
          updated_at
        `)
        .eq("employee_id", employeeId)
        .eq("year", year)
        .maybeSingle();

      if (balanceError) {
        throw balanceError;
      }

      // --------------------------------------------------
      // If balance doesn't exist
      // --------------------------------------------------

      if (!leaveBalance) {
       leaveBalance = await initializeLeaveBalance(employeeId, year);
      }

      // --------------------------------------------------
      // Calculate pending requests
      // --------------------------------------------------

      const pendingRequests = (leaveHistory || []).filter(
        (leave) => leave.status === "Pending",
      ).length;

      // --------------------------------------------------
      // Leave balance comes directly from leave_balance
      // --------------------------------------------------

      const casualLeave = Number(
        leaveBalance.casual_leave || 0,
      );

      const sickLeave = Number(
        leaveBalance.sick_leave || 0,
      );

      const earnedLeave = Number(
        leaveBalance.earned_leave || 0,
      );

      const lop = Number(
        leaveBalance.lop || 0,
      );

      // Total remaining paid leave
      const leaveBalanceTotal =
        casualLeave +
        sickLeave +
        earnedLeave;

      // --------------------------------------------------
      // Response
      // --------------------------------------------------

      res.status(200).json({
        stats: {
          leaveBalance: leaveBalanceTotal,

          casualLeave,

          sickLeave,

          earnedLeave,

          lop,

          pendingRequests,
        },

        leaveBalance,

        leaveHistory: leaveHistory || [],
      });
    } catch (error) {
      console.error(
        "Get employee leaves error:",
        error,
      );

      res.status(500).json({
        message: safeErrorMessage(error, "employeeLeaveController"),
      });
    }
  };

  // ======================================================
  // CREATE LEAVE REQUEST
  // ======================================================

  export const createLeaveRequest = async (req, res) => {
    try {
      const {
        leave_type,
        start_date,
        end_date,
        is_half_day,
        reason,
      } = req.body;

      const employeeId = req.user.employee_id;

      const year = new Date(start_date).getFullYear();

      // FIX: when this request carries a file (multipart/form-data via
      // multer), every other field arrives as a string too - so
      // is_half_day comes through as the string "true"/"false", which is
      // truthy either way in JS. Coerce it explicitly instead of relying
      // on the raw value's truthiness below.
      const isHalfDay = is_half_day === true || is_half_day === "true";

      // --------------------------------------------------
      // Validate required fields
      // --------------------------------------------------

      if (
        !leave_type ||
        !start_date ||
        !reason
      ) {
        return res.status(400).json({
          message:
            "Leave type, start date and reason are required.",
        });
      }

      // --------------------------------------------------
      // Half day
      // --------------------------------------------------

      const actualEndDate = isHalfDay
        ? start_date
        : end_date;

      let totalDays = 0.5;

      // --------------------------------------------------
      // Full day / multiple days
      // --------------------------------------------------

      if (!isHalfDay) {
        if (!end_date) {
          return res.status(400).json({
            message: "End date is required.",
          });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (end < start) {
          return res.status(400).json({
            message:
              "End date cannot be before start date.",
          });
        }

        totalDays =
          Math.ceil(
            (end - start) /
              (1000 * 60 * 60 * 24),
          ) + 1;
      }

      // --------------------------------------------------
      // Get current leave balance
      // --------------------------------------------------

      let {
        data: leaveBalance,
        error: balanceError,
      } = await supabase
        .from("leave_balance")
        .select(`
          id,
          employee_id,
          casual_leave,
          sick_leave,
          earned_leave,
          lop,
          year
        `)
        .eq("employee_id", employeeId)
        .eq("year", year)
        .maybeSingle();

      if (balanceError) {
        throw balanceError;
      }

      if (!leaveBalance) {
        return res.status(400).json({
          message:
            `Leave balance not initialized for ${year}.`,
        });
      }

      // --------------------------------------------------
      // Check available balance
      //
      // IMPORTANT:
      // This does NOT deduct the balance here.
      //
      // Balance is deducted when the leave becomes
      // approved and the daily leave job processes it.
      // --------------------------------------------------

      const balanceMap = {
        "Casual Leave":
          Number(leaveBalance.casual_leave || 0),

        "Sick Leave":
          Number(leaveBalance.sick_leave || 0),

        "Earned Leave":
          Number(leaveBalance.earned_leave || 0),
      };

      // --------------------------------------------------
      // Validate leave type
      // --------------------------------------------------

      if (
        leave_type !== "Unpaid Leave" &&
        balanceMap[leave_type] === undefined
      ) {
        return res.status(400).json({
          message: `Invalid leave type: ${leave_type}`,
        });
      }

      // --------------------------------------------------
      // Check available paid leave
      // --------------------------------------------------

      if (leave_type !== "Unpaid Leave") {
        const available =
          balanceMap[leave_type];

        /**
         * We allow the request even if the balance is
         * insufficient because your deductLeave service
         * already supports:
         *
         * Available = 0.5
         * Requested = 1
         * Paid leave = 0.5
         * LOP = 0.5
         *
         * Therefore don't reject the request here.
         */
        console.log(
          `[LEAVE] ${leave_type}: Available=${available}, Requested=${totalDays}`,
        );
      }

      // --------------------------------------------------
      // Upload attachment (optional)
      //
      // Images -> Cloudinary (attachment_url stores the full secure_url).
      // PDFs -> private Supabase Storage bucket (attachment_url stores
      // just the storage path; viewed later via a signed URL).
      // getLeaveAttachmentUrl() tells the two apart by checking whether
      // the stored value already looks like a full URL.
      // --------------------------------------------------

      let attachmentPath = null;

      if (req.file) {
        if (req.file.mimetype.startsWith("image/")) {
          try {
            const result = await uploadImageToCloudinary(
              req.file.buffer,
              `leave-attachments/${employeeId}`,
            );
            attachmentPath = result.secure_url;
          } catch (uploadError) {
            return res.status(500).json({
              message: `Attachment upload failed: ${uploadError.message}`,
            });
          }
        } else {
          const fileExt = req.file.originalname.split(".").pop();
          const safeName = `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}.${fileExt}`;
          const storagePath = `${employeeId}/${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from("leave-attachments")
            .upload(storagePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: false,
            });

          if (uploadError) {
            return res.status(500).json({
              message: `Attachment upload failed: ${uploadError.message}`,
            });
          }

          attachmentPath = storagePath;
        }
      }

      // --------------------------------------------------
      // Create leave request
      // --------------------------------------------------

      const {
        data,
        error,
      } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: employeeId,

          leave_type,

          start_date,

          end_date: actualEndDate,

          days: totalDays,

          is_half_day: isHalfDay,

          reason,

          attachment_url: attachmentPath,
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          message: safeErrorMessage(error, "employeeLeaveController"),
        });
      }

      // --------------------------------------------------
      // Notify HR
      // --------------------------------------------------

      await createNotification({
        title: "New Leave Request",

        message: `${req.user.employee_code} has submitted a leave request.`,

        type: "Leave",

        role: "HR",

        reference_id: data.id,
      });

      // --------------------------------------------------
      // Response
      // --------------------------------------------------

      res.status(201).json({
        message: "Leave request submitted successfully.",

        data,

        balance: {
          casual_leave:
            Number(leaveBalance.casual_leave || 0),

          sick_leave:
            Number(leaveBalance.sick_leave || 0),

          earned_leave:
            Number(leaveBalance.earned_leave || 0),

          lop:
            Number(leaveBalance.lop || 0),
        },
      });
    } catch (err) {
      console.error(
        "Create leave request error:",
        err,
      );

      res.status(500).json({
        message: safeErrorMessage(err, "employeeLeaveController"),
      });
    }
  };

  // ======================================================
  // GET LEAVE ATTACHMENT (signed URL)
  // ======================================================
  //
  // The "leave-attachments" bucket is private, so the file's storage
  // path alone can't be opened directly - this issues a short-lived
  // signed URL instead. Accessible to the employee who owns the leave
  // request, and to Admin/HR reviewing it.

  export const getLeaveAttachmentUrl = async (req, res) => {
    try {
      const { id } = req.params;

      const { data: leave, error: leaveError } = await supabase
        .from("leave_requests")
        .select("employee_id, attachment_url")
        .eq("id", id)
        .maybeSingle();

      if (leaveError) throw leaveError;

      if (!leave || !leave.attachment_url) {
        return res.status(404).json({
          message: "No attachment found for this leave request.",
        });
      }

      const isOwner = req.user.employee_id === leave.employee_id;
      const isReviewer = ["Admin", "HR"].includes(req.user.role);

      if (!isOwner && !isReviewer) {
        return res.status(403).json({
          message: "You don't have access to this attachment.",
        });
      }

      // Cloudinary URLs are already full, publicly-fetchable URLs -
      // return as-is. Anything else is a path in the private Supabase
      // "leave-attachments" bucket, which needs a signed URL.
      if (leave.attachment_url.startsWith("http")) {
        return res.json({ url: leave.attachment_url });
      }

      const { data: signed, error: signError } = await supabase.storage
        .from("leave-attachments")
        .createSignedUrl(leave.attachment_url, 300); // 5 minutes

      if (signError) throw signError;

      res.json({ url: signed.signedUrl });
    } catch (err) {
      console.error("Get leave attachment error:", err);

      res.status(500).json({
        message: safeErrorMessage(err, "employeeLeaveController"),
      });
    }
  };
