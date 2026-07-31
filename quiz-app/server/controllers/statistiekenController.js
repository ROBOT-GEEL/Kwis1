import { getDB } from "../config/db.js";
import logger from "../config/logger.js";

export const getResults = async (req, res, next) => {
  console.log("Grafieken requested quiz results.");

  try {
    const db = getDB();
    const collection_questions = db.collection("questions");
    const collection_results = db.collection("results");

    const allQuestions = await collection_questions.find({}).sort({
        enabled: -1,
        easyQuestion: -1
      }).toArray();
    const finalResults = [];

    for (const question of allQuestions) {
      const resultsForQuestion = await collection_results.find({ questionId: question.questionId }).toArray();

      let bezochtAantal = 0;
      let bezochtResultaten = [0, 0, 0]; // [A, B, C]

      let nietBezochtAantal = 0;
      let nietBezochtResultaten = [0, 0, 0]; // [A, B, C]

      for (const result of resultsForQuestion) {
        const valA = result.results?.[0] || 0;
        const valB = result.results?.[1] || 0;
        const valC = result.results?.[2] || 0;

        if (result.hasVisited === true) {
          bezochtAantal += valA + valB + valC; 
          bezochtResultaten[0] += valA;
          bezochtResultaten[1] += valB;
          bezochtResultaten[2] += valC;
        } else {
          nietBezochtAantal += valA + valB + valC;
          nietBezochtResultaten[0] += valA;
          nietBezochtResultaten[1] += valB;
          nietBezochtResultaten[2] += valC;
        }
      }

      finalResults.push({
        question: question.nl || "",
        easyQuestion: question.easyQuestion || false,
        enabledQuestion: question.enabled || false,
        correct: question.correctAnswer ?? "",
        totalVisited: bezochtAantal,
        resultsVisited: bezochtResultaten,
        totalNotVisited: nietBezochtAantal,
        resultsNotVisited: nietBezochtResultaten,
      });
    }

    console.log(`Grafieken requested quiz results, processed => ${finalResults.length} questions`);
    res.json(finalResults);

  } catch (e) {
    console.error("Error retrieving quiz results:", e);
    res.status(500).send("Error retrieving results from the database.");
  }
};

export const getTimeseries = async (req, res, next) => {
  console.log("Grafieken requested time series from", req.body.questionId);

  try {
    const db = getDB();
    const collection_results = db.collection("results");
    const collection_questions = db.collection("questions");
    const questionId = parseInt(req.body.questionId);

    if (isNaN(questionId)) {
      return res.status(400).send("Invalid question ID");
    }

    const pipeline = [
      { $match: { questionId: questionId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          questionId: { $first: "$questionId" },
          quizId: { $first: "$quizId" },
          results: { $push: "$results" },
        },
      },
      {
        $project: {
          timestamp: {
            $dateFromParts: {
              year: { $year: { $toDate: "$_id" } },
              month: { $month: { $toDate: "$_id" } },
              day: { $dayOfMonth: { $toDate: "$_id" } },
              hour: 12,
              minute: 0,
            },
          },
          questionId: 1,
          quizId: 1,
          results: {
            $map: {
              input: { $range: [0, { $size: { $arrayElemAt: ["$results", 0] } }] },
              as: "index",
              in: {
                $sum: {
                  $map: {
                    input: "$results",
                    as: "resultArray",
                    in: { $arrayElemAt: ["$$resultArray", "$$index"] },
                  },
                },
              },
            },
          },
        },
      },
      { $sort: { timestamp: 1 } },
      { $unwind: { path: "$results", includeArrayIndex: "index" } },
      {
        $addFields: {
          origin: {
            $switch: {
              branches: [
                { case: { $eq: ["$index", 0] }, then: "A" },
                { case: { $eq: ["$index", 1] }, then: "B" },
                { case: { $eq: ["$index", 2] }, then: "C" },
              ],
              default: "unknown",
            },
          },
        },
      },
      { $addFields: { data: ["$timestamp", "$results"] } },
      { $unset: ["index", "timestamp", "results"] },
      {
        $group: {
          _id: "$origin",
          documents: { $push: "$data" },
        },
      },
      {
        $group: {
          _id: null,
          docs: {
            $push: {
              k: "$_id",
              v: "$documents",
            },
          },
        },
      },
      { $replaceRoot: { newRoot: { $arrayToObject: "$docs" } } },
    ];

    const timeseriesResult = await collection_results.aggregate(pipeline).toArray();

    const questionInfoResult = await collection_questions.findOne({ questionId });

    if (!timeseriesResult.length || !questionInfoResult) {
      return res.status(404).send("No data found for this question ID");
    }

    console.log(
      `Time series result got => ${timeseriesResult[0].A?.length ?? 0} answers from A for question:`,
      questionInfoResult.nl.question
    );

    res.json({ results: timeseriesResult[0], info: questionInfoResult });
  } catch (e) {
    logger.error("Error retrieving time series data:", e);
    res.status(500).send("Error retrieving results from the database.");
  }
};
