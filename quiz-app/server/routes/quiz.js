import express from "express";
import {
    getQuestions,
    getNewId,
    getParameters,
    getInstructions,
    getTimeToStart
} from "../controllers/quizController.js";

const router = express.Router();

router.post("/questions", getQuestions);
router.get("/new-id", getNewId);
router.get("/parameters", getParameters);
router.get("/instructions", getInstructions);
router.get("/time-to-start", getTimeToStart);

export default router;
