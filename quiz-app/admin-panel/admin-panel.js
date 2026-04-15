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
        response = await fetch('/projector-control/toggle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({projectorState: String(state)})
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