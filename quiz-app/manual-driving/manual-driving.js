/*
 * Script to handle manual driving events via WebSockets.
 */

let driveInterval = null;
let currentDirection = null;
let speed = 1;


function toggleSpeed() {
    speed = speed + 1;
    if (speed >= 4) {
        speed = 1;
    }

    const icon = document.getElementById('speed-icon');
    if (speed === 1) {
        icon.src = "assets/icons/slow.svg";
    } else if (speed === 2) {
        icon.src = "assets/icons/medium.svg";
    } else if (speed === 3) {
        icon.src = "assets/icons/fast.svg";
    }
}

function startDriving(direction, event) {
    if (event && event.type === 'touchstart') {
        event.preventDefault();
    }

    // Als we al deze kant op rijden, stop dan
    if (currentDirection === direction) return;

    if (driveInterval !== null) {
        clearInterval(driveInterval);
    }

    currentDirection = direction;

    // 2. Stuur het event 'drive' zoals je Python-code verwacht
    socket.emit('drive', { direction: currentDirection, speed: speed });

    driveInterval = setInterval(() => {
        socket.emit('drive', { direction: currentDirection, speed: speed });
    }, 100);
}

function stopDriving() {
    if (driveInterval !== null || currentDirection !== null) {
        if (driveInterval !== null) {
            clearInterval(driveInterval);
            driveInterval = null;
        }
        currentDirection = null;

        // 3. Stuur de stop-opdracht via het 'drive' kanaal
        socket.emit('drive', { direction: 'stop', speed: 0 });
    }
}