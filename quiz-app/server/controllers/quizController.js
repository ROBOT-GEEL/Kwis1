import path from "path";
import { getDB } from "../config/db.js";

// Haal quizvragen op
export const getQuestions = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("questions");
        const easyQuestion = req.body.easyQuestion;
        const amount = req.body.amount;

        const documents = await collection.aggregate([
            { $match: { easyQuestion: easyQuestion, enabled: true } },
            { $sample: { size: amount } }
        ]).toArray();

        res.status(200).json(documents);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

export const getStatisticsForProjector = async (req, res) => {
    try {
        const db = getDB();
        const resultsCollection = db.collection("results");
        const questionsCollection = db.collection("questions");
        const quizId = req.body.quizId; 

        const quizResults = await resultsCollection.find({ quizId: quizId }).toArray();


        let totalCorrect = 0;
        let total = 0;

        for (let i = 0; i < quizResults.length; i++) {
            const currentResult = quizResults[i];
            const resultsArray = currentResult.results;
            resultsArray.reverse(); //Pi telt vanuit zijn standpunt van links naar rechts dus [C,B,A]
            const questionId = currentResult.questionId;
            
            const question = await questionsCollection.findOne({ questionId: questionId });

            if (question) {
                const correctAnswerIndex = question.correctAnswer;        
                totalCorrect += resultsArray[correctAnswerIndex];
                total += resultsArray.reduce((som, aantal) => som + aantal, 0);
            }
        }

        res.status(200).json({ 
            total: total, 
            totalCorrect: totalCorrect 
        });

    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

// Haal nieuwe quizId op
export const getNewId = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("results");

        const maxQuizId = await collection.find().sort({ quizId: -1 }).limit(1).next();
        res.status(200).json({ quizId: (maxQuizId?.quizId || 0) + 1 });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error retrieving quiz id');
    }
};

// Haal quizparameters op
export const getParameters = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("params");
        /**
         * Always read the parameters document that is managed by the CMS.
         * The CMS saves settings with { name: "settings", ... } via an upsert.
         * Using findOne({}) can accidentally return an older/legacy document,
         * which makes the quiz ignore the values you see in the Settings UI.
         */
        const parameters = await collection.findOne({ name: "settings" });
        res.status(200).json(parameters);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error retrieving quiz parameters');
    }
};

// Haal instructies op
export const getInstructions = async (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), "instructions.json"));
    } catch (e) {
        console.error(e);
        res.status(500).send('Error retrieving instructions');
    }
};

// Haal tijd tot start op
export const getTimeToStart = async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("params");
        // Same reasoning as in getParameters: explicitly use the "settings" doc.
        const parameters = await collection.findOne({ name: "settings" });
        res.status(200).json({ time: parameters.timeToStartQuiz });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error retrieving time to start');
    }
};
