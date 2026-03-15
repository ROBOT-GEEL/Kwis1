// Get or generate a unique token for this specific browser tab
let adminToken = sessionStorage.getItem("adminToken");
if (!adminToken) {
    adminToken = Math.random().toString(36).substring(2);
    sessionStorage.setItem("adminToken", adminToken);
}

// Initialize Socket.io connection pointing to localhost
const socket = io(); 

// Expose the socket globally so specific page scripts (like settings.js) can use it
window.socket = socket;

socket.on("connect", () => {
    // Authenticate with the server upon connection using the token
    socket.emit("admin-panel-open", adminToken, () => {
        console.log("Admin session verified across page load.");
    });
});

socket.on("admin-kick", (message, callback) => {
    if (typeof callback === 'function') {
        callback({ status: "acknowledged" });
    }
    setTimeout(() => {
        alert(message);
        window.location.href = '../'; // Redirect to safety
    }, 100);
});

// Make the disconnect function available globally for the "Back to quiz" buttons
window.backToQuiz = async function() {
    socket.emit("admin-panel-closed", adminToken, () => {
        sessionStorage.removeItem("adminToken"); // Clean up
        console.log("Closing admin panel intentionally");
        location.href = '../';
    });
};