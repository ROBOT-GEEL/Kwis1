const socket = io(`ws://${window.location.hostname}`);

function startup() {
    socket.emit("robot-startup");
}

function exploring() {
    socket.emit("robot-explore");
}

function atVisitor() {
    socket.emit("robot-arrived-at-visitors");
}

function atQuizLocation() {
    socket.emit("robot-arrived-at-quiz-location");
}

function goCharge() {
    socket.emit("robot-go-charge");
}

function charging() {
    socket.emit("robot-charging");
}

function errorDrive() {
    socket.emit("robot-error-drive");
}

function errorCharge() {
    socket.emit("robot-error-charge");
}

function disconnect() {
    socket.emit("robot-disconnected");
}

function docking() {
    socket.emit("robot-docking");
}

function projectorEndScreen() {
    socket.emit("projector-show-end-screen");
}

function projectorStatsScreen() {
    socket.emit("projector-show-stats-screen");
}

function robotLostCharging() {
    socket.emit("robot-lost-charging");
}

function followRobotScreen() {
    socket.emit("follow-robot-screen");
}
