import net from "net";
import { getRobotStatus } from "./robotStatusController.js";

/**
 * Business logic to determine if the projector should be active.
 * Returns the desired state (true/false) or null if it remains unchanged.
 */
export async function getTargetProjectorState() {
    try {
        const robotStatus = await getRobotStatus();
        console.log("getTargetProjectorState")
        console.log(robotStatus?.robotActive)
        return robotStatus?.robotActive;
        

    } catch (error) {
        return null;
    }
}

export const toggleProjector = async (req, res, next) => {
    const { projectorState } = req.body;
    let state = projectorState;
    
    if ((!state) || (state === "DB")) { // Als er niets is meegestuurd, haal het dan uit de DB
        try {
            const response = await fetch("http://localhost:80/robot-status/get-robot-status");

            if (response.ok) {
                const antwoord = await response.json();
                const dbActive = antwoord.data?.robotActive; 
                
                if (dbActive === true) state = "1"; // Zet de database boolean (true/false) om naar de verwachte strings ("1"/"0")
                else if (dbActive === false) state = "0";
                
            } else {
                console.error(`Interne API gaf een foutcode: ${response.status}`);
            }
        } catch (fetchError) {
            console.error("Interne fetch naar DB faalde:", fetchError);
        }
    }

    // Zorg ervoor dat state altijd een string is, om errors bij de === check te voorkomen
    if (state !== undefined && state !== null) {
        state = String(state);
    }

    // Validate input: Check if state is properly determined
    if (!state) {
        return res.status(400).json({
            success: false,
            error: "Missing projectorState in request body and DB fallback failed."
        });
    }

    // Translate numeric state to command string
    let command;
    if (state === "1") {
        command = "PROJECTORON";
    } else if (state === "0") {
        command = "PROJECTOROFF";
    } else if (state === "sleep") {
        command = "PROJECTORSLEEP";
    } else if (state === "wake") {
        command = "PROJECTORNOTSLEEP";
    } else {
        // Validate input: Check if the state is known
        return res.status(400).json({
            success: false,
            error: `Invalid projectorState: ${state}`
        });
    }

    const client = new net.Socket();

    const RECEIVER_IP = process.env.PROJECTOR_RECEIVER_IP;
    const RECEIVER_PORT = process.env.PROJECTOR_PORT;

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