import net from "net";
import crypto from "crypto";
import { ObjectId } from "mongodb";

export const getJetsonIp = async (req, res, next) => {
  res.json(process.env.PROJECTOR_RECEIVER_IP || "192.168.137.101");
}

export const saveZones = async (req, res, next) => {
    let { coordinates } = req.body;
    const RECEIVER_IP = process.env.PROJECTOR_RECEIVER_IP || "192.168.137.101";
    const RECEIVER_PORT = process.env.ZONE_CONFIG_PORT || "5051";

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

export const toggleProjector = async (req, res, next) => {
  // Extract state from the request body
  const { projectorState } = req.body;
  console.log("Projector toggle requested, state:", projectorState);

  // Validate input: Check if projectorState is provided
  if (!projectorState) {
    return res.status(400).json({
      success: false,
      error: "Missing projectorState in request body"
    });
  }

  // Translate numeric state to command string
  let command;
  if (projectorState === "1") {
    command = "PROJECTORON";
  } else if (projectorState === "0") {
    command = "PROJECTOROFF";
  } else if (projectorState === "sleep") {
    command = "PROJECTORSLEEP";
  } else if (projectorState === "wake") {
    command = "PROJECTORNOTSLEEP";
  } else {
    // Validate input: Check if the state is known
    return res.status(400).json({
      success: false,
      error: `Invalid projectorState: ${projectorState}`
    });
  }

  const client = new net.Socket();
  
  const RECEIVER_IP = process.env.PROJECTOR_RECEIVER_IP || "192.168.137.101";
  const RECEIVER_PORT = process.env.PROJECTOR_PORT || 5050;

  // Track if a response has already been sent to prevent Express errors
  let responseSent = false;

  // Set a timeout to prevent hanging connections
  client.setTimeout(7000);

  client.connect(RECEIVER_PORT, RECEIVER_IP, () => {
    console.log("Connected to projector receiver");
    client.write(command + "\n"); // Send command
  });

  client.on("data", (data) => {
    const responseText = data.toString().trim();
    console.log("Receiver response:", responseText);
    
    if (!responseSent) {
      // Check if the Orin Nano reported a projector error
      if (responseText.includes("ERROR") || responseText.includes("FAIL")) {
        res.status(502).json({
          success: false,
          error: "The orin nano is connected, but can't communicate with the projector.",
          details: responseText
        });
      } else {
        // Everything went perfectly
        res.status(200).json({
          success: true,
          message: `Command sent to orin nano and executed successfully.`,
          response: responseText
        });
      }
      responseSent = true;
    }
    client.destroy();
  });

  client.on("error", (err) => {
    console.error("Socket error:", err.message);
    if (!responseSent) {
      // This means the Pi could not talk to the Orin Nano
      res.status(503).json({
        success: false,
        error: "Could not connect with the orin nano",
        details: err.message
      });
      responseSent = true;
    }
    client.destroy();
  });

  client.on("timeout", () => {
    console.error("Socket connection timed out");
    if (!responseSent) {
      res.status(504).json({
        success: false,
        error: "Connection to projector receiver timed out"
      });
      responseSent = true;
    }
    client.destroy(); // Kill the connection on timeout
  });

  client.on("close", () => {
    console.log("Connection to projector receiver closed");
  });
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
        bezocht: false,
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
    const questions = await collection.find({}).toArray();
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

export const saveVisitedCheckBoxes = async (req, res, next) => {
  const collection = global.db.collection("questions");
  const { questionDict } = req.body;

  try {
    const bulkOperations = [];

    for (const questionId in questionDict) {
      const questionIdObject = new ObjectId(questionId);
      const { visitedSwitch } = questionDict[questionId];
      bulkOperations.push({
        updateOne: {
          filter: { _id: questionIdObject },
          update: { $set: { bezocht: visitedSwitch } },
        },
      });
    }

    const result = await collection.bulkWrite(bulkOperations);
    console.log(`${result.modifiedCount} visited flags changed successfully`);
    res.status(200).send(`${result.modifiedCount} visited flags changed successfully`);
  } catch (error) {
    console.error("Error saving visited flags:", error);
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

export const getSettings = async (req, res, next) => {
  try {
    const collection = global.db.collection("params");
    /**
     * Always return the CMS-managed settings document.
     * The CMS stores settings with { name: "settings", ... } via an upsert.
     * Using findOne({}) can accidentally return an old/legacy params document,
     * which makes the defaults shown in the Settings UI differ from the
     * values actually used by the quiz.
     */
    const settings = await collection.findOne({ name: "settings" });
    res.json(settings || {});
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Internal Server Error");
  }
};
