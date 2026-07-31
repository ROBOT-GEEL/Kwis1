import express from "express";
import { makeDiagnose, rebootRobot, shutdownRobot, rebootSoftRobot }
    from "../controllers/diagnoseController.js";
const router = express.Router();

router.post("/make-diagnose", makeDiagnose);
router.post("/reboot-robot", rebootRobot);
router.post("/reboot-soft-robot", rebootSoftRobot);
router.post("/shutdown-robot", shutdownRobot);


export default router;
