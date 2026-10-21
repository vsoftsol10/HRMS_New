// import express from "express";

// import {
// getSalaryConfigurations,
// updateSalaryConfiguration,
// getSalaryConfigurationById,
// deleteSalaryConfiguration,
// createSalaryConfiguration
// } from "../controller/salaryConfigurationController.js";

// import authMiddleware from "../middleware/authmiddleware.js";
// import roleMiddleware from "../middleware/roleMiddleware.js";

// const router = express.Router();

// router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurations);
// router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurationById);
// router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createSalaryConfiguration);
// router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateSalaryConfiguration);
// router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteSalaryConfiguration);

// export default router;

import express from "express";

import {
getSalaryConfigurations,
updateSalaryConfiguration,
getSalaryConfigurationById,
deleteSalaryConfiguration,
createSalaryConfiguration,
getSalaryConfigurationUsage,
getSalaryConfigurationUsageSummary
} from "../controller/salaryConfigurationController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurations);
router.get("/usage", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurationUsageSummary);
router.get("/:id/usage", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurationUsage);
router.get("/:id", authMiddleware, roleMiddleware("Admin", "HR"), getSalaryConfigurationById);
router.post("/", authMiddleware, roleMiddleware("Admin", "HR"), createSalaryConfiguration);
router.put("/:id", authMiddleware, roleMiddleware("Admin", "HR"), updateSalaryConfiguration);
router.delete("/:id", authMiddleware, roleMiddleware("Admin", "HR"), deleteSalaryConfiguration);

export default router;