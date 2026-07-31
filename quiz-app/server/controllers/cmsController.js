import crypto from "crypto";
import { ObjectId } from "mongodb";
import { exec } from "child_process";

export const saveZones = async (req, res, next) => {
    let { coordinates } = req.body;
    const RECEIVER_IP = process.env.PROJECTOR_RECEIVER_IP;
    const RECEIVER_PORT = process.env.ZONE_CONFIG_PORT;

    try {
        const response = await fetch(`http://${RECEIVER_IP}:${RECEIVER_PORT}/save_zones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(coordinates),
        });

        if (!response.ok) {
            throw new Error(`Jetson error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Succes:', data);
        res.status(200).json(data);

    } catch (error) {
        console.error('Fout:', error);
        res.status(500).json({ error: 'Er ging iets mis bij het opslaan naar de Jetson' });
    }
};

//Haal de zones op om ze te laten zien bij het openen van het scherm
//Toevoeging Matthijs
export const getZones = async (req, res, next) => {
    const RECEIVER_IP = process.env.PROJECTOR_RECEIVER_IP;
    const RECEIVER_PORT = process.env.ZONE_CONFIG_PORT;

    try {
        // We vragen de huidige zones op bij de Jetson
        const response = await fetch(`http://${RECEIVER_IP}:${RECEIVER_PORT}/get_zones`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Jetson error: ${response.statusText}`);
        }

        const data = await response.json();
        
        res.status(200).json({ coordinates: data });

    } catch (error) {
        console.error('Fout bij ophalen zones:', error);
        res.status(500).json({ error: 'Kon de opgeslagen zones niet ophalen van de Jetson' });
    }
};

export const delQuestion = async (req, res, next) => {
  try {
    const collection = global.db.collection("questions");
    const questionId = new ObjectId(req.body.questionId);
    await collection.deleteOne({ _id: questionId });
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const editQuestion = async (req, res, next) => {
  try {
    const collection = global.db.collection("questions");

    const question = req.body.newQuestion;
    const answers = [req.body.newAnswer1, req.body.newAnswer2, req.body.newAnswer3];

    const questionKey =
      req.body.language === "en"
        ? "en.question"
        : req.body.language === "nl"
        ? "nl.question"
        : "fr.question";
    const answersKey =
      req.body.language === "en"
        ? "en.answers"
        : req.body.language === "nl"
        ? "nl.answers"
        : "fr.answers";

    // If editing an existing question
    if (req.body.questionId) {
      const questionIdObject = new ObjectId(req.body.questionId);
      const filter = { _id: questionIdObject };
      const updateOperation = {
        $set: {
          [questionKey]: question,
          [answersKey]: answers,
          correctAnswer: req.body.correctAnswer,
        },
      };
      await collection.updateOne(filter, updateOperation);
      res.status(200).send({ updated: true });
    } else {
      // Create a new question
      const highestIdPipeline = [
        { $group: { _id: null, maxQuestionId: { $max: "$questionId" } } },
      ];
      const highestIndex = await collection.aggregate(highestIdPipeline).toArray();
      const newId = highestIndex[0] ? highestIndex[0].maxQuestionId + 1 : 0;

      const newQuestion = {
        correctAnswer: req.body.correctAnswer,
        en: { question, answers },
        fr: { question, answers },
        nl: { question, answers },
        enabled: true,
        easyQuestion: false,
        questionId: newId,
      };

      const result = await collection.insertOne(newQuestion);
      res.status(200).send({ newId: result.insertedId });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const getQuestions = async (req, res, next) => {
  try {
    const collection = global.db.collection("questions");
    const questions = await collection.find({}).sort({
      enabled: -1,
      easyQuestion: -1
    }).toArray();
    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const saveEnabledCheckBoxes = async (req, res, next) => {
  const collection = global.db.collection("questions");
  const { questionDict } = req.body;

  try {
    const bulkOperations = [];

    for (const questionId in questionDict) {
      const questionIdObject = new ObjectId(questionId);
      const { enableSwitch } = questionDict[questionId];
      bulkOperations.push({
        updateOne: {
          filter: { _id: questionIdObject },
          update: { $set: { enabled: enableSwitch } },
        },
      });
    }

    const result = await collection.bulkWrite(bulkOperations);
    console.log(`${result.modifiedCount} enabled flags changed successfully`);
    res.status(200).send(`${result.modifiedCount} enabled flags changed successfully`);
  } catch (error) {
    console.error("Error saving enabled flags:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const saveEasyCheckBoxes = async (req, res, next) => {
  const collection = global.db.collection("questions");
  const { questionDict } = req.body;

  try {
    const bulkOperations = [];

    for (const questionId in questionDict) {
      const questionIdObject = new ObjectId(questionId);
      const { easySwitch } = questionDict[questionId];
      bulkOperations.push({
        updateOne: {
          filter: { _id: questionIdObject },
          update: { $set: { easyQuestion: easySwitch } },
        },
      });
    }

    const result = await collection.bulkWrite(bulkOperations);
    console.log(`${result.modifiedCount} easy flags changed successfully`);
    res.status(200).send(`${result.modifiedCount} easy flags changed successfully`);
  } catch (error) {
    console.error("Error saving easy flags:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const saveSettings = async (req, res, next) => {
  try {
    const collection = global.db.collection("params");
    const { settingsDict } = req.body;

    await collection.updateOne(
      { name: "settings" },
      { $set: settingsDict },
      { upsert: true }
    );

    console.log("Settings saved successfully");
    res.status(200).send("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const fetchSettingsFromDB = async () => {
    const collection = global.db.collection("params");
    const settings = await collection.findOne({ name: "settings" });
    return settings || {};
};

export const getSettings = async (req, res, next) => {
  try {
    /**
     * Always return the CMS-managed settings document.
     * The CMS stores settings with { name: "settings", ... } via an upsert.
     * Using findOne({}) can accidentally return an old/legacy params document,
     * which makes the defaults shown in the Settings UI differ from the
     * values actually used by the quiz.
     */
    const settings = await fetchSettingsFromDB();
    res.json(settings || {});
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Internal Server Error");
  }
};
