import express from "express";
import { toggleProjector } from "../controllers/projectorController.js";
const router = express.Router();

router.post("/toggle", toggleProjector);

export default router;