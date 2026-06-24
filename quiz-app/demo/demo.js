const socket = io(`ws://${window.location.hostname}`);

function startup() {
    socket.emit("robot-startup");
}

function exploring() {
    socket.emit("robot-explore");
}

function toVisitor() {
    socket.emit("robot-go-to-visitors");
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
