import { getDB } from "../config/db.js";
import logger from "../config/logger.js";

export const getRobotStatus = async (req, res, next) => {
    logger.info("getRobotStatus requested");

    try {
        const db = getDB();
        const robotStatus = db.collection("robotStatus");

        // 1. Bepaal de op te vragen velden (fallback is het originele lijstje)
        const defaultFields = ["robotActive", "currentScreen", "projectorOn"];
        let requestedFields = defaultFields;

        // Als de client specifieke velden meegeeft (bijv: ?fields=robotActive,projectorOn)
        if (req.query.fields) {
            requestedFields = req.query.fields.split(',').map(field => field.trim());
        }

        // 2. Bouw dynamisch een array van promises op voor elk gevraagd veld
        const promises = requestedFields.map(field => 
            robotStatus.findOne({ [field]: { $exists: true } }, { sort: { tijd: -1 } })
        );

        // 3. Wacht tot alle queries klaar zijn
        const docs = await Promise.all(promises);

        // 4. Bouw het response object dynamisch op basis van de resultaten
        const samengevoegdeData = {
            laatsteUpdates: {}
        };

        requestedFields.forEach((field, index) => {
            const doc = docs[index];
            samengevoegdeData[field] = doc?.[field] ?? null;
            samengevoegdeData.laatsteUpdates[field] = doc?.tijd ?? null;
        });

        return res.status(200).json({ succes: true, data: samengevoegdeData });

    } catch (e) {
        logger.error(`Er is een fout opgetreden bij het lezen uit de robotStatus database: ${e.message}`);
        return res.status(500).json({ succes: false });
    }
};

export const insertRobotStatus = async (req, res, next) => {
    try {
        const db = getDB();
        const robotStatus = db.collection("robotStatus");
        
        const nieuweStatus = {
            ...req.body,
            tijd: new Date()
        };

        await robotStatus.insertOne(nieuweStatus);

        return res.status(200).json({ succes: true });

    } catch (e) {
        logger.error(`Er is een fout opgetreden bij het schrijven in de robotStatus database: ${e.message}`);
        return res.status(500).json({ succes: false });
    }
};