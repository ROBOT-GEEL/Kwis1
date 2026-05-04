import express from "express";
import { verifyPin } from "../controllers/authController.js";
const router = express.Router();

router.post("/verifyPin", verifyPin);

export default router;