import net from "net";
import { fetchSettingsFromDB } from "./cmsController.js";

let lastProjectorStatus = null;

/**
 * Business logic to determine if the projector should be active.
 * Returns the desired state (true/false) or null if it remains unchanged.
 */
export async function getTargetProjectorState() {
    try {
        const settings = await fetchSettingsFromDB();
        const now = new Date();

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = days[now.getDay()];
        const dayConfig = settings?.schedule?.[currentDay];

        let shouldBeOn = false;

        if (dayConfig?.active && dayConfig.start && dayConfig.end && settings?.robotActive) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${hours}:${minutes}`;

            if (currentTime >= dayConfig.start && currentTime < dayConfig.end && settings.robotActive) {
                shouldBeOn = true;
            }
        }

        // Only return a boolean if the state actually changes, otherwise return null
        if (shouldBeOn !== lastProjectorStatus) {
            lastProjectorStatus = shouldBeOn;
            return shouldBeOn;
        }

        return null; // No change needed
    } catch (error) {
        return null;
    }
}

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
            if (responseText.includes("ERROR")) {
                res.status(502).json({
                    success: false,
                    error: "Het bericht is ontvangen door de Jetson Orin Nano, maar kon niet worden doorgestuurd naar de projector.",
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
                error: "Er kon geen verbinding worden gemaakt met de Jetson Orin Nano.",
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
                error: "De connectie met de Jetson Orin Nano is verlopen. Er is geen reactie ontvangen binnen de verwachte tijd.",
            });
            responseSent = true;
        }
        client.destroy(); // Kill the connection on timeout
    });

    client.on("close", () => {
        console.log("Connection to projector receiver closed");
    });
};