import express from "express";
import {
    getQuestions,
    getStatisticsForProjector,
    getNewId,
    getParameters,
    getInstructions,
    getTimeToStart
} from "../controllers/quizController.js";

const router = express.Router();

router.post("/questions", getQuestions);
router.post("/getstatisticsforprojector", getStatisticsForProjector);
router.get("/new-id", getNewId);
router.get("/parameters", getParameters);
router.get("/instructions", getInstructions);
router.get("/time-to-start", getTimeToStart);

export default router;
