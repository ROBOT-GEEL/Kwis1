import express from "express";
import { delQuestion, editQuestion, getQuestions, saveEnabledCheckBoxes, saveEasyCheckBoxes,
    saveSettings, getSettings, saveZones, getZones } from "../controllers/cmsController.js";
const router = express.Router();

router.post("/delQuestion", delQuestion);
router.post("/editQuestion", editQuestion);
router.get("/getQuestions", getQuestions);
router.post("/saveEnabledCheckBoxes", saveEnabledCheckBoxes);
router.post("/saveEasyCheckBoxes", saveEasyCheckBoxes);
router.post("/saveSettings", saveSettings);
router.get("/getSettings", getSettings);
router.post("/saveZones", saveZones);
router.get('/getZones', getZones);

export default router;
