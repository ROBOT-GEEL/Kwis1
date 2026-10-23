import logger from "../config/logger.js";
import { getDB } from "../config/db.js";
import { getTargetProjectorState } from "../controllers/projectorController.js";
import { exec } from "child_process";
import { getRobotStatus } from "../controllers/robotStatusController.js";

export function registerSocketHandlers(io) {

  let currentAdminToken = null;
  let currentAdminSocketId = null;
  let disconnectTimer = null; // Used to track page navigation
  let adminLoginOpen = false;
  let robotRebootLock = false;

  let orinNanoRobotId = null;

  let screenOn = false; // Track the current state of the screen

  const sendRobotScreenState = async () => {
    if (!orinNanoRobotId) {
      return;
    }

    try {
      const db = getDB();
      const status = await db.collection("robotStatus").findOne(
        { robotStatusId: 0 },
        { projection: { robotRebootLock: 1 } }
      );
      robotRebootLock = status?.robotRebootLock === true;
    } catch (error) {
      robotRebootLock = true;
      logger.error("Could not read persisted robot reboot lock:", error);
    }

    io.to(orinNanoRobotId).emit("robot-screen-state", {
      adminOpen: Boolean(currentAdminToken),
      adminLoginOpen,
      robotRebootLock
    });
  };

  const releaseRobotRebootLock = async () => {
    try {
      const db = getDB();
      const status = await db.collection("robotStatus").findOne(
        { robotStatusId: 0 },
        { projection: { robotRebootLock: 1 } }
      );

      if (status?.robotRebootLock !== true) {
        return;
      }

      const released = await writeRobotRebootLockInDB(false);
      if (!released) {
        logger.error("Robot reboot lock was not released: database update failed.");
        return;
      }

      robotRebootLock = false;
      logger.info("Robot reboot lock released after quiz screen became available.");
      await sendRobotScreenState();
    } catch (error) {
      logger.error("Could not release persisted robot reboot lock:", error);
    }
  };

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
        sendRobotScreenState();
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
      console.log("schrijf nu in DB");
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
      "robot-ready",
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
      "robot-quiz-options-pause",
      "robot-visitor-no-response",
      "drive",
      "robot-stop-for-x-time",
      "login-canceled"
    ];

    robotEvents.forEach((event) => {
      socket.on(event, async (data) => {
        logger.info(event, data || "");
        if (event !== "robot-bumper-status") {
          console.log(event, data || "");
        }
        socket.broadcast.emit(event, data);

        if (event === "drive-to-quiz-location") {
          socket.broadcast.emit("drive_to_quiz_location");
        }

        if (event === "robot-isActive") {
          toggleProjector("DB");
        }

        if (event === "robot-askScreen") {
          if (socket.id === orinNanoRobotId) {
            await sendRobotScreenState();
          } else {
            await releaseRobotRebootLock();
          }
        }
      });
    });

    socket.on("robot-login-open", (callback) => {
      adminLoginOpen = true;
      socket.broadcast.emit("robot-login-open");

      if (typeof callback === "function") callback({ success: true });
    });

    socket.on("robot-login-closed", (callback) => {
      adminLoginOpen = false;
      socket.broadcast.emit("robot-login-closed");

      if (typeof callback === "function") callback({ success: true });
    });

    
    //
    // Quiz interface events
    //
    const quizEvents = ["quiz-finished", "quiz-inactive"];
    quizEvents.forEach((event) => {
      socket.on(event, () => {
        logger.info(event);
        console.log(event);
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
        console.log(event);
        logger.info(event);
        socket.broadcast.emit(event);
      });
    });

    //
    // Admin panel events
    //
    socket.on("admin-panel-open", (token, callback) => {
        console.log("admin-panel-open");
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
            adminLoginOpen = false;

            writeAdminStatusInDB(true); 
            toggleProjector("sleep");
            socket.broadcast.emit("admin-panel-open");

            if (typeof callback === "function") callback();
        } catch (error) {
            logger.error("Error in admin-panel-open:", error);
        }
    });

    socket.on("admin-panel-closed", async (token, callback) => {
        console.log("admin-panel-closed");
        try {
            if (token === currentAdminToken) {
                currentAdminToken = null; 
                currentAdminSocketId = null;
                adminLoginOpen = false;

                writeAdminStatusInDB(false); 
                socket.broadcast.emit("admin-panel-closed");
                logger.info("Admin panel closed");

                toggleProjector("DB");

            }
            if (typeof callback === "function") callback();
        } catch (error) {
            logger.error("Error in admin-panel-closed:", error);
        }
    });

    socket.on("admin-panel-close-for-reboot", async (token, options, callback) => {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        const acknowledge = (result) => {
            if (typeof callback === "function") callback(result);
        };

        try {
            if (
                token !== currentAdminToken ||
                socket.id !== currentAdminSocketId
            ) {
                acknowledge({
                    success: false,
                    message: "Deze browser heeft geen actieve adminsessie."
                });
                return;
            }

            const holdRobotStopped = options?.holdRobotStopped === true;
            const statusSaved = await writeAdminRebootStatusInDB(
                false,
                holdRobotStopped
            );
            if (!statusSaved) {
                acknowledge({
                    success: false,
                    message: holdRobotStopped
                        ? "De adminstatus en robotvergrendeling konden niet veilig worden bijgewerkt."
                        : "De adminstatus kon niet worden bijgewerkt."
                });
                return;
            }

            robotRebootLock = holdRobotStopped || robotRebootLock;

            if (disconnectTimer) {
                clearTimeout(disconnectTimer);
                disconnectTimer = null;
            }

            currentAdminToken = null;
            currentAdminSocketId = null;
            adminLoginOpen = false;

            if (holdRobotStopped) {
                await sendRobotScreenState();
            }

            toggleProjector("DB");
            logger.info(
                holdRobotStopped
                    ? "Admin panel closed for combined reboot; persisted robot stop remains active."
                    : "Admin panel closed for Orin reboot; robot stop remains active."
            );

            // Do not notify the robot that the admin panel closed before reboot.
            acknowledge({ success: true });
        } catch (error) {
            logger.error("Error closing admin panel for robot reboot:", error);
            acknowledge({
                success: false,
                message: "Het adminpaneel kon niet veilig worden gesloten."
            });
        }
    });

    socket.on("disconnect", () => {
        try {
            if (socket.id === currentAdminSocketId) {
                // Give the frontend 5 seconds to load the new HTML page before releasing the lock
                disconnectTimer = setTimeout(() => {
                    currentAdminToken = null;
                    currentAdminSocketId = null;
                    adminLoginOpen = false;
                    writeAdminStatusInDB(false); 
                    socket.broadcast.emit("admin-panel-closed");
                    logger.info("Admin connection lost");
                }, 5000); 
            }
        } catch (error) {
            logger.error("Error during disconnect:", error);
        }
    });

    socket.on("screen-reboot", (data, callback) => {
      const acknowledge = (result) => {
        if (typeof callback === "function") {
          callback(result);
        }
      };

      if (!data || !["hard", "shutdown"].includes(data.type)) {
        acknowledge({
          success: false,
          message: "Ongeldig schermcommando."
        });
        return;
      }

      if (data.type === 'hard') {
          console.log("Reboot command voor de Pi ontvangen.");
          
          exec("sudo reboot", (error, stdout, stderr) => {
              if (error) {
                  console.error(`Fout bij het rebooten van de Pi: ${error.message}`);
                  logger.error(`Fout bij het rebooten van de Pi: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.error(`Reboot waarschuwing/fout: ${stderr}`);
                  logger.error(`Reboot waarschuwing/fout: ${stderr}`);
                  return;
              }
              console.log(`Reboot succesvol gestart: ${stdout}`);
          });
          acknowledge({ success: true });
      } else if (data.type === 'shutdown') {
          console.log("shutdown command voor de Pi ontvangen.");
          
          exec("sudo shutdown now", (error, stdout, stderr) => {
              if (error) {
                  console.error(`Fout bij shutdown van de Pi: ${error.message}`);
                  logger.error(`Fout bij shutdown van de Pi: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.error(`Shutdown waarschuwing/fout: ${stderr}`);
                  logger.error(`Shutdown waarschuwing/fout: ${stderr}`);
                  return;
              }
              console.log(`Shutdown succesvol gestart: ${stdout}`);
          });
          acknowledge({ success: true });
      }
    });
  });

  // Send the time to all the clients
  //setInterval(() => {io.emit("time-updated", new Date().toISOString());}, 3600000);

  // Check if the projector needs to be turned on by looking for robotActive in DB (elke 5 minuten)
  setInterval(() => toggleProjector("DB"), 300000); 
}



/**
 * Sends a toggle command to the projector.
 * Retries automatically on network or server errors.
 */
async function toggleProjector(action, failcount = 0) {
    const retryDelay = 10000;
    const maxRetry = 5;

    if (failcount >= maxRetry){return;}

    try {
        const response = await fetch("http://localhost/projector-control/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectorState: action })
        });

        if (response && response.ok) {
            const data = await response.json();
            console.log("Projector command successful:", data);
            logger.info("Projector command successful:", data);
        } else {
            // Server error
            logger.error(`Server error (${response ? response.status : "No response"}). Retrying in ${retryDelay / 1000}s...`);
            console.log(`Server error (${response ? response.status : "No response"}). Retrying in ${retryDelay / 1000}s...`);
            await wait(retryDelay);
            return toggleProjector(action, failcount+1);
        }
    } catch (error) {
        // Network error
        logger.error(`Network error: ${error.message}. Retrying in ${retryDelay / 1000}s...`);
        console.log(`Network error: ${error.message}. Retrying in ${retryDelay / 1000}s...`);
        await wait(retryDelay);
        return toggleProjector(action, failcount+1);
    }
}

/**
 * Helper function to create a delay.
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeAdminStatusInDB(isOpen) {
  try {
      const response = await fetch("http://localhost:80/robot-status/insert-robot-status", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminPanelIsOpen: isOpen })
      });

      if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
      }

      return true;
  } catch (fetchError) {
      logger.error("Interne fetch naar DB faalde:", fetchError);
      return false;
  }
}

async function writeRobotRebootLockInDB(isLocked) {
  try {
      const response = await fetch("http://localhost:80/robot-status/insert-robot-status", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ robotRebootLock: isLocked })
      });

      if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
      }

      return true;
  } catch (fetchError) {
      logger.error("Interne fetch voor robot reboot lock faalde:", fetchError);
      return false;
  }
}

async function writeAdminRebootStatusInDB(adminPanelIsOpen, holdRobotStopped) {
  try {
      const status = { adminPanelIsOpen };
      if (holdRobotStopped) {
          status.robotRebootLock = true;
      }

      const response = await fetch("http://localhost:80/robot-status/insert-robot-status", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(status)
      });

      if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
      }

      return true;
  } catch (fetchError) {
      logger.error("Interne fetch voor admin/rebootstatus faalde:", fetchError);
      return false;
  }
}
