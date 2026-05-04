import express from "express";
import { getJetsonIp, getZoneConfigPort } from "../controllers/configController.js";
const router = express.Router();

router.get("/getJetsonIp", getJetsonIp);
router.get("/getZoneConfigPort", getZoneConfigPort);

export default router;