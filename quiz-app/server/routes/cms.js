import express from "express";
import { delQuestion, editQuestion, getQuestions, saveEnabledCheckBoxes, saveVisitedCheckBoxes,
    saveSettings, getSettings, saveZones, getJetsonIp } from "../controllers/cmsController.js";
const router = express.Router();

router.post("/delQuestion", delQuestion);
router.post("/editQuestion", editQuestion);
router.get("/getQuestions", getQuestions);
router.post("/saveEnabledCheckBoxes", saveEnabledCheckBoxes);
router.post("/saveVisitedCheckBoxes", saveVisitedCheckBoxes);
router.post("/saveSettings", saveSettings);
router.get("/getSettings", getSettings);
router.post("/saveZones", saveZones);
router.get("/getJetsonIp", getJetsonIp);

export default router;
