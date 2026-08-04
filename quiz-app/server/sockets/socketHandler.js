import logger from "../config/logger.js";
import { getDB } from "../config/db.js";
import { getTargetProjectorState } from "../controllers/projectorController.js";
import { exec } from "child_process";
import { getRobotStatus } from "../controllers/robotStatusController.js";

export function registerSocketHandlers(io) {

  let currentAdminToken = null;
  let currentAdminSocketId = null;
  let disconnectTimer = null; // Used to track page navigation

  let orinNanoRobotId = null;

  let screenOn = false; // Track the current state of the screen

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
      if (socket.id === orinNanoRobotId) {
        orinNanoRobotId = null;
        socket.broadcast.emit("robot-disconnected");
      }
    });

    socket.on("identification", (data) => {
      if (data === "orin-nano-robot") {
        orinNanoRobotId = socket.id;
        logger.info(`Orin Nano Robot connected with socket ID: ${socket.id}`);
        //io.emit("time-updated", new Date().toISOString());
        socket.broadcast.emit("robot-connected");
      }
    });

    //
    // Projector events
    //
    socket.on("projector-update-question", (data) => {
      logger.info("update-question", data);
      socket.broadcast.emit("projector-update-question", data);
    });

    socket.on("projector-update-countdown", (data) => {
      socket.broadcast.emit("projector-update-countdown", data);
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

    socket.on("projector-show-instructions-1", (data) => {
      socket.broadcast.emit("projector-show-instructions-1", data);
    });

    socket.on("projector-show-instructions-2", (data) => {
      socket.broadcast.emit("projector-show-instructions-2", data);
    });

    socket.on("projector-show-start-screen", (data) => {
      socket.broadcast.emit("projector-show-start-screen", data);
    });

    socket.on("projector-show-end-screen", (data) => {
      socket.broadcast.emit("projector-show-end-screen", data);
    });

    socket.on("projector-show-stats-screen", (data) => {
      socket.broadcast.emit("projector-show-stats-screen", data);
    });

    socket.on("projector-show-counting-screen", (data) => {
      socket.broadcast.emit("projector-show-counting-screen", data);
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

        if (msg.status === "success") {

          const dataToSave = {
              quizId: msg.quizId,
              questionId: msg.questionId,
              results: msg.results,
              hasVisited: msg.hasVisited,
              timestamp: new Date()
          };
          await collection.insertOne(dataToSave);
        }

        socket.broadcast.emit("pi-count-people-answer", msg);
      } catch (e) {
        logger.error(e);
      }
    });


    //
    // Robot platform events
    //
  
    const robotEvents = [
      "robot-activeButtonToggled",
      "robot-askIsActive",
      "robot-isActive",
      "robot-askScreen",
      "robot-startup",
      "robot-explore",
      "robot-arrived-at-visitors",
      "drive-to-quiz-location",
      "robot-arrived-at-quiz-location",
      "follow-robot-screen",
      "robot-go-charge",
      "robot-docking",
      "robot-charging",
      "robot-error-drive",
      "robot-error-charge",
      "robot-disconnected",
      "robot-reboot",
      "robot-lost-charging",
      "robot-get-battery-percentage",
      "robot-update-battery-percentage",
      "robot-bumper-status",
      "drive",
      "robot-stop-for-x-time"
    ];

    robotEvents.forEach((event) => {
      socket.on(event, (data) => {
        logger.info(event, data || "");
        if (event !== "robot-bumper-status"){
          console.log(event, data || "");
        }
        socket.broadcast.emit(event, data);

        if (event === "drive-to-quiz-location") {
          socket.broadcast.emit("drive_to_quiz_location");
        }

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

            writeAdminStatusInDB(true); 
            toggleProjector("sleep");
            socket.broadcast.emit("admin-panel-open");

            if (typeof callback === "function") callback();
        } catch (error) {
            logger.error("Error in admin-panel-open:", error);
        }
    });

    socket.on("admin-panel-closed", async (token, callback) => {
        try {
            if (token === currentAdminToken) {
                currentAdminToken = null; 
                currentAdminSocketId = null;

                writeAdminStatusInDB(false); 
                socket.broadcast.emit("admin-panel-closed");
                logger.info("Admin panel closed");

                syncProjectorState();
            }
            if (typeof callback === "function") callback();
        } catch (error) {
            logger.error("Error in admin-panel-closed:", error);
        }
    });

    socket.on("disconnect", () => {
        try {
            if (socket.id === currentAdminSocketId) {
                // Give the frontend 5 seconds to load the new HTML page before releasing the lock
                disconnectTimer = setTimeout(() => {
                    currentAdminToken = null;
                    currentAdminSocketId = null;
                    writeAdminStatusInDB(false); 
                    socket.broadcast.emit("admin-panel-closed");
                    logger.info("Admin connection lost");
                }, 5000); 
            }
        } catch (error) {
            logger.error("Error during disconnect:", error);
        }
    });

    socket.on("screen-reboot", (data) => {
    
      if (data.type === 'hard') {
          console.log("Reboot command voor de Pi ontvangen. Herstarten...");
          
          exec("sudo reboot", (error, stdout, stderr) => {
              if (error) {
                  console.error(`Fout bij het rebooten van de Pi: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.error(`Reboot waarschuwing/fout: ${stderr}`);
                  return;
              }
              console.log(`Reboot succesvol gestart: ${stdout}`);
          });
      }
    });
  });

  // Send the time to all the clients
  //setInterval(() => {io.emit("time-updated", new Date().toISOString());}, 3600000);

  // Check if the projector needs to be turned on
  setInterval(() => syncProjectorState(), 60000); 
}

/**
 * Synchronizes the projector state with the target state.
 * If an error occurs, it will keep retrying until successful.
 */
async function syncProjectorState() {
    const newState = await getTargetProjectorState();
    
    if (newState === true) {
        await toggleProjector("1");
        //await toggleProjector("sleep"); Veroorzaker van de uitval??
    } else if (newState === false) {
        await toggleProjector("0");
    }
}

/**
 * Sends a toggle command to the projector.
 * Retries automatically on network or server errors.
 */
async function toggleProjector(action) {
    const retryDelay = 10000;

    try {
        const response = await fetch("http://localhost/projector-control/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectorState: action })
        });

        if (response && response.ok) {
            const data = await response.json();
            logger.info("Projector command successful:", data);
        } else {
            // Server error
            logger.error(`Server error (${response ? response.status : "No response"}). Retrying in ${retryDelay / 1000}s...`);
            await wait(retryDelay);
            return toggleProjector(action);
        }
    } catch (error) {
        // Network error
        logger.error(`Network error: ${error.message}. Retrying in ${retryDelay / 1000}s...`);
        await wait(retryDelay);
        return toggleProjector(action);
    }
}

/**
 * Helper function to create a delay.
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeAdminStatusInDB(isOpen){
  try {
      await fetch("http://localhost:80/robot-status/insert-robot-status", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPanelIsOpen: isOpen })
      });
  } catch (fetchError) {
      logger.error("Interne fetch naar DB faalde:", fetchError);
  }
}



