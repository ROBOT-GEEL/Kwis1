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
let closingAdminForReboot = false;

socket.on("connect", () => {
    if (closingAdminForReboot) {
        return;
    }

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

window.closeAdminPanelForReboot = function(options = {}) {
    return new Promise((resolve, reject) => {
        if (!socket.connected) {
            reject(new Error("Geen verbinding met de Pi-server."));
            return;
        }

        closingAdminForReboot = true;
        const timeout = setTimeout(() => {
            closingAdminForReboot = false;
            reject(new Error("De Pi-server bevestigde het sluiten niet."));
        }, 5000);

        socket.emit("admin-panel-close-for-reboot", adminToken, options, (result) => {
            clearTimeout(timeout);

            if (!result || !result.success) {
                closingAdminForReboot = false;
                reject(new Error(
                    result?.message || "Adminsessie kon niet worden gesloten."
                ));
                return;
            }

            resolve();
        });
    });
};

window.restoreAdminSessionAfterFailedReboot = function() {
    return new Promise((resolve, reject) => {
        if (!socket.connected) {
            closingAdminForReboot = false;
            reject(new Error("Geen verbinding om de adminsessie te herstellen."));
            return;
        }

        const timeout = setTimeout(() => {
            closingAdminForReboot = false;
            reject(new Error("De adminsessie kon niet worden hersteld."));
        }, 5000);

        socket.emit("admin-panel-open", adminToken, () => {
            clearTimeout(timeout);
            closingAdminForReboot = false;
            resolve();
        });
    });
};

// Make the disconnect function available globally for the "Back to quiz" buttons
window.backToQuiz = async function() {
    socket.emit("admin-panel-closed", adminToken, () => {
        sessionStorage.removeItem("adminToken"); // Clean up
        console.log("Closing admin panel intentionally");
        location.href = '../';
    });
};