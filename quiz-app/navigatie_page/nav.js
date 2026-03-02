const socket = io('ws://localhost');

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

function quiz() {
        window.location.href = '../';
}

function driveStop() {
        console.log('drive stop');
        socket.emit('drive-stop');
}

function goCMS() {
        window.location.href = '../cms';
}