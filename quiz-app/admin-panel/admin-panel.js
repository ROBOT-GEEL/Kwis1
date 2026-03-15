// Initialize Socket.io connection pointing to localhost
const socket = io("http://localhost");

// Listen for successful connection to the server
socket.on("connect", () => {
    console.log("Connected to socket server successfully.");
    socket.emit("admin-panel-open");
});

async function toggleProjector(state) {
    // Check if a state was actually passed
    if (!state) {
        console.error("No command given in toggleProjector function");
        return;
    }

    console.log("Sending command to projector:", state);

    let response;
    try {
        // Send a POST request to the server with the state in the body
        response = await fetch('/cms/toggleProjector', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Tell the server we are sending JSON
            },
            body: JSON.stringify({
                projectorState: String(state) // Match the exact variable name expected by the backend
            })
        });
    } catch (error) {
        console.error("Network error while communicating with the server:", error);
        return; // Exit on network error
    }

    // Try to parse the JSON response
    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        console.error("Error parsing JSON from server:", parseError);
        return; // Exit on parse error
    }

    // Check if the HTTP request failed OR if the backend reported a logical error
    if (!response.ok || !data.success) {
        console.error(`Error (${response.status}):`, data.error || "Unknown error occurred");
        return; // Exit on API error
    }

    // If everything went smoothly
    console.log("Success:", data.message);
}