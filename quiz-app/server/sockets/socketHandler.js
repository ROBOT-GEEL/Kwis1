import logger from "../config/logger.js";
import { getDB } from "../config/db.js";

export function registerSocketHandlers(io) {

    let currentAdminToken = null;
    let currentAdminSocketId = null;
    let disconnectTimer = null; // Used to track page navigation

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    //
    // Projector events
    //
    socket.on("projector-update-question", (data) => {
      logger.info("update-question", data);
      socket.broadcast.emit("projector-update-question", data);
    });

    socket.on("projector-start-countdown", (data) => {
      socket.broadcast.emit("projector-start-countdown", data);
    });

    socket.on("projector-display-answers", (data) => {
      socket.broadcast.emit("projector-display-answers", data);
    });

    socket.on("projector-reset", () => {
      socket.broadcast.emit("projector-reset");
    });

    socket.on("projector-clear-answers", () => {
      socket.broadcast.emit("projector-clear-answers");
    });


    //
    // Pi / people counting events
    //
    socket.on("pi-count-people", (msg) => {
      logger.info("pi-count-people", msg);
      socket.broadcast.emit("count_people_event", msg);
    });

    socket.on("count_people_answer", async (msg) => {
      logger.info("count_people_answer", msg);

      try {
        const db = getDB();
        const collection = db.collection("results");

        msg.timestamp = new Date(); // voeg UTC timestamp toe
        await collection.insertOne(msg);

        socket.broadcast.emit("pi-count-people-answer", msg);
      } catch (e) {
        logger.error(e);
      }
    });

    //
    // Robot platform events
    //
    const robotEvents = [
      "robot-startup",
      "robot-explore",
      "robot-go-to-visitors",
      "robot-arrived-at-visitors",
      "drive-to-quiz-location",
      "robot-arrived-at-quiz-location",
      "robot-go-charge",
      "robot-charging",
    ];

    robotEvents.forEach((event) => {
      socket.on(event, (data) => {
        logger.info(event, data || "");
        socket.broadcast.emit(event, data);
        // Special handling for Python-compatible socket
        if (event === "drive-to-quiz-location") {
          socket.broadcast.emit("drive_to_quiz_location");
        }
      });
    });

    //
    // Manual drive control events
    //
    const driveEvents = [
      "drive-forward",
      "drive-backward",
      "drive-left",
      "drive-right",
      "drive-stop",
      "drive-cw",
      "drive-ccw",
    ];

    driveEvents.forEach((event) => {
      socket.on(event, () => {
        logger.info(`manual control ${event}`);
        socket.broadcast.emit(event);
      });
    });

    //
    // Quiz interface events
    //
    const quizEvents = ["quiz-finished", "quiz-inactive"];
    quizEvents.forEach((event) => {
      socket.on(event, () => {
        logger.info(event);
        socket.broadcast.emit(event);
      });
    });

    //
    // People detection system events
    //
    const peopleEvents = [
      "system-people-detected",
      "system-visitors-left-platform",
    ];

    peopleEvents.forEach((event) => {
      socket.on(event, () => {
        logger.info(event);
        socket.broadcast.emit(event);
      });
    });

    //
    // Admin panel events
    //
    socket.on("admin-panel-open", (token, callback) => {
        try {
            // Clear any pending disconnect timers to prevent accidental lock releases
            if (disconnectTimer) {
                clearTimeout(disconnectTimer);
                disconnectTimer = null;
            }

            // Check if there is an active session that belongs to someone else
            if (currentAdminToken && currentAdminToken !== token && currentAdminSocketId) {
                // Kick the old connection out
                io.to(currentAdminSocketId).emit("admin-kick", "Je sessie is overgenomen door een ander apparaat.");
                logger.info("Previous admin kicked because a new admin took over.");
            }

            // Register the NEW admin token and socket, effectively taking over
            currentAdminToken = token;
            currentAdminSocketId = socket.id;
            
            socket.broadcast.emit("admin-panel-open");

            if (typeof callback === "function") callback();
        } catch (error) {
            console.error("Error in admin-panel-open:", error);
        }
    });

    socket.on("admin-panel-closed", (token, callback) => {
        try {
            if (token === currentAdminToken) {
                currentAdminToken = null; 
                currentAdminSocketId = null;
                socket.broadcast.emit("admin-panel-closed");
                logger.info("Admin panel closed");
            }
            if (typeof callback === "function") callback();
        } catch (error) {
            console.error("Error in admin-panel-closed:", error);
        }
    });

    socket.on("disconnect", () => {
        try {
            if (socket.id === currentAdminSocketId) {
                // Give the frontend 5 seconds to load the new HTML page before releasing the lock
                disconnectTimer = setTimeout(() => {
                    currentAdminToken = null;
                    currentAdminSocketId = null;
                    socket.broadcast.emit("admin-panel-closed");
                    logger.info("Admin connection lost");
                }, 5000); 
            }
        } catch (error) {
            console.error("Error during disconnect:", error);
        }
    });

    


    //
    // Touchscreen display toggle (dummy implementation)
    //
    socket.on("set-display", (data) => {
      logger.info(`Turning display ${data ? "on" : "off"}`);
        // if (data) {
        //     exec(`sh ${path.join(__dirname, 'display_on.sh')}`, (error, stdout, stderr) => {
        //         if (error) {
        //             logger.error(`Error turning display on: `, error);
        //             return;
        //         }
        //         if (stderr) {
        //             logger.error(`Error turning display on: `, stderr);
        //             return;
        //         }
        //         logger.info('Display turned on: ', stdout);
        //     });
        // } else {
        //     exec(`sh ${path.join(__dirname, 'display_off.sh')}`, (error, stdout, stderr) => {
        //         if (error) {
        //             logger.error(`Error turning display off: `, error);
        //             return;
        //         }
        //         if (stderr) {
        //             logger.error(`Error turning display off: `, stderr);
        //             return;
        //         }
        //         logger.info('Display turned off: ', stdout);
        //     });
        // }
    });
  });
}
