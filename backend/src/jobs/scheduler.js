// import cron from "node-cron";

// import { processDailyLeaves } from "./processDailyLeaves.js";
// import { processDailyAbsence, processDailyLop } from "./processDailyAbsence.js";
// import { processAutoCheckout } from "./processAutoCheckout.js";

// /*
//  * FIX: this file used to be an exact copy of processDailyLeaves.js and
//  * never called cron.schedule(), while server.js imports it expecting it
//  * to start the daily jobs. As a result processDailyLeaves and
//  * processDailyAbsence were never run automatically: no Absent rows, no
//  * LOP, no leave deduction and no "On Leave" status sync.
//  *
//  * Both jobs are idempotent (they skip employees who already have an
//  * attendance row for today, and processDailyAbsence itself refuses to run
//  * before attendance_policy.office_end_time), so it is safe to run them on
//  * a short interval. Leaves run first so an approved leave is recorded as
//  * "Leave" before the absence job can mark that employee Absent.
//  *
//  * Times are the server's LOCAL time, same as dateUtils.js.
//  *
//  * Set DISABLE_DAILY_JOBS=true in .env to switch the jobs off (e.g. while
//  * testing on a local machine, so real attendance rows are not created).
//  */

// let running = false;
// let scheduledTask = null;

// // Called on shutdown so no new run starts while the process is closing.
// export const stopScheduler = () => {
//   if (scheduledTask) {
//     scheduledTask.stop();
//     scheduledTask = null;
//   }
// };

// export const runDailyJobs = async () => {
//   if (running) {
//     console.log("[SCHEDULER] Previous run still in progress. Skipping this tick.");
//     return;
//   }

//   running = true;

//   try {
//     await processDailyLeaves();
//     await processDailyAbsence();
//     // Close days with no check-out at office end time (flagged for HR review)
//     // BEFORE the LOP job, so those rows are held back instead of being
//     // counted as a full day.
//     await processAutoCheckout();
//     // Last, so Absent/Leave rows written above already carry their own LOP
//     // and are skipped; this one handles checked-in rows (hours shortfall).
//     await processDailyLop();
//   } catch (error) {
//     console.error("[SCHEDULER] Daily jobs failed:", error.message);
//   } finally {
//     running = false;
//   }
// };

// if (process.env.DISABLE_DAILY_JOBS === "true") {
//   console.log("[SCHEDULER] DISABLE_DAILY_JOBS=true - daily jobs are NOT scheduled.");
// } else {
//   scheduledTask = cron.schedule("*/30 * * * *", runDailyJobs);

//   console.log("[SCHEDULER] Daily leave/absence jobs scheduled (every 30 minutes).");
// }

import cron from "node-cron";

import { processDailyLeaves } from "./processDailyLeaves.js";
import { processDailyAbsence, processDailyLop } from "./processDailyAbsence.js";

/*
 * FIX: this file used to be an exact copy of processDailyLeaves.js and
 * never called cron.schedule(), while server.js imports it expecting it
 * to start the daily jobs. As a result processDailyLeaves and
 * processDailyAbsence were never run automatically: no Absent rows, no
 * LOP, no leave deduction and no "On Leave" status sync.
 *
 * Both jobs are idempotent (they skip employees who already have an
 * attendance row for today, and processDailyAbsence itself refuses to run
 * before attendance_policy.office_end_time), so it is safe to run them on
 * a short interval. Leaves run first so an approved leave is recorded as
 * "Leave" before the absence job can mark that employee Absent.
 *
 * Times are the server's LOCAL time, same as dateUtils.js.
 *
 * Set DISABLE_DAILY_JOBS=true in .env to switch the jobs off (e.g. while
 * testing on a local machine, so real attendance rows are not created).
 */

let running = false;
let scheduledTask = null;

// Called on shutdown so no new run starts while the process is closing.
export const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
};

export const runDailyJobs = async () => {
  if (running) {
    console.log("[SCHEDULER] Previous run still in progress. Skipping this tick.");
    return;
  }

  running = true;

  try {
    await processDailyLeaves();
    await processDailyAbsence();
    // No auto check-out: employees often work past office end time and
    // check out themselves. A row with no check-out yet is held back by
    // processDailyLop (needsReview) and picked up once they check out.
    // Last, so Absent/Leave rows written above already carry their own LOP
    // and are skipped; this one handles checked-in rows (hours shortfall).
    await processDailyLop();
  } catch (error) {
    console.error("[SCHEDULER] Daily jobs failed:", error.message);
  } finally {
    running = false;
  }
};

if (process.env.DISABLE_DAILY_JOBS === "true") {
  console.log("[SCHEDULER] DISABLE_DAILY_JOBS=true - daily jobs are NOT scheduled.");
} else {
  scheduledTask = cron.schedule("*/30 * * * *", runDailyJobs);

  console.log("[SCHEDULER] Daily leave/absence jobs scheduled (every 30 minutes).");
}