import express from "express";

import {
getAllComponents,
createComponent,
updateComponent,
// deleteComponent,
} from "../controller/salaryComponentMasterController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";


const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getAllComponents);

router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createComponent);

router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateComponent);

// router.delete("/:id", deleteComponent);


export default router;