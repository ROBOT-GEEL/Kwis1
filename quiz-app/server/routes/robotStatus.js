import express from "express";
import { getRobotStatus, insertRobotStatus}
    from "../controllers/robotStatusController.js";
const router = express.Router();

router.get("/get-robot-status", getRobotStatus);
router.post("/insert-robot-status", insertRobotStatus);

export default router;
