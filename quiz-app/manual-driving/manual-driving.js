/*
 * Script to handle manual driving events via WebSockets.
 */

const socket = io('ws://localhost');

// ============================================================================
// Directional Driving Functions
// ============================================================================

function driveForward() {
    console.log('drive forward...');
    socket.emit('drive-forward');
}

function driveLeft() {
    console.log('drive left...');
    socket.emit('drive-left');
}

function driveRight() {
    console.log('drive right...');
    socket.emit('drive-right');
}

function driveBackward() {
    console.log('drive backward...');
    socket.emit('drive-backward');
}

function driveStop() {
    console.log('drive stop');
    socket.emit('drive-stop');
}

// ============================================================================
// Rotation Functions
// ============================================================================

function driveRotateCW() {
    console.log('drive rotate clockwise...');
    socket.emit('drive-rotate-cw');
}

function driveRotateCCW() {
    console.log('drive rotate counter-clockwise...');
    socket.emit('drive-rotate-ccw');
}