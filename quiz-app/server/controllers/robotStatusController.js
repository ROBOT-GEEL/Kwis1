import { getDB } from "../config/db.js";
import logger from "../config/logger.js";

export const getRobotStatus = async (req, res, next) => {

    try {
        const db = getDB();
        const robotStatus = db.collection("robotStatus");

        let projection = { _id: 0 }; 

        if (req.query.fields) {
            const requestedFields = req.query.fields.split(',').map(field => field.trim());
            requestedFields.forEach(field => {
                projection[field] = 1;
            });
            projection.tijd = 1; 
        }

        // Haal altijd het actuele record op met id 0
        const status = await robotStatus.findOne({ _id: 0 }, { projection });

        if (!status) {
            return res.status(200).json({ succes: true, data: {} });
        }
        return res.status(200).json({ succes: true, data: status });

    } catch (e) {
        logger.error(`Er is een fout opgetreden bij het lezen uit de robotStatus database: ${e.message}`);
        return res.status(500).json({ succes: false });
    }
};

export const insertRobotStatus = async (req, res, next) => {

    try {
        const db = getDB();
        const robotStatus = db.collection("robotStatus");

        // 3. Update het vaste record (id 0) met de nieuwe data
        const updateData = {
            ...req.body,
            tijd: new Date()
        };

        await robotStatus.updateOne(
            { _id: 0 },
            { $set: updateData },
            { upsert: true }
        );

        return res.status(200).json({ succes: true });

    } catch (e) {
        logger.error(`Er is een fout opgetreden bij het schrijven in de robotStatus database: ${e.message}`);
        return res.status(500).json({ succes: false });
    }
};