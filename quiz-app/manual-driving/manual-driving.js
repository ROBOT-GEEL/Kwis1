/*
 * Script to handle manual driving events via WebSockets.
 */

let driveInterval = null;
let currentEvent = null;

/**
 * Starts the driving interval and emits the initial socket event.
 * @param {string} direction - The direction name (e.g., 'forward', 'left').
 * @param {Event} event - The original UI event (optional).
 */
function startDriving(direction, event) {
    // Prevent double triggering on touch devices (prevents ghost clicks)
    if (event && event.type === 'touchstart') {
        event.preventDefault();
    }

    const eventName = `drive-${direction}`;
    
    // If we are already sending this specific event, do nothing (prevents log spam)
    if (currentEvent === eventName) return;

    // Log only the start of the action
    console.log("START:", eventName);

    // Clear any existing interval before starting a new one
    if (driveInterval !== null) {
        clearInterval(driveInterval);
    }

    currentEvent = eventName;

    // Send the first event immediately
    socket.emit(currentEvent);

    // Background interval: sends the event every 100ms without logging
    driveInterval = setInterval(() => {
        if (currentEvent) {
            socket.emit(currentEvent);
        }
    }, 100);
}

/**
 * Stops the driving interval and sends the stop signal to the server.
 */
function stopDriving() {
    // Only trigger stop logic if we were actually moving
    if (driveInterval !== null || currentEvent !== null) {
        console.log("STOP");

        if (driveInterval !== null) {
            clearInterval(driveInterval);
            driveInterval = null;
        }

        currentEvent = null;
        socket.emit('drive-stop');
    }
}