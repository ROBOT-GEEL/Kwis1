/**
 * Script for handling global Socket.IO events.
 * Depends on:
 * - app.js (socket)
 * - utils.js (changeScreen)
 * - quiz.js (Quiz)
 */

// ==========================================
// SOCKET LISTENERS
// ==========================================
socket.on('robot-startup', () => { robotStartup(); });
socket.on('robot-lost-charging', () => { robotLostCharging(); });
socket.on('robot-explore', () => { robotExplore(); });
socket.on('robot-go-to-visitors', () => { robotGoToVisitors(); });
socket.on('robot-arrived-at-visitors', () => { robotArrivedAtVisitors(); });
socket.on('robot-arrived-at-quiz-location', async () => { await robotArrivedAtQuizLocation(); });
socket.on('robot-go-charge', () => { robotGoCharge(); });
socket.on('robot-docking', () => { robotDocking(); });
socket.on('robot-charging', () => { robotCharging(); });
socket.on('robot-error-drive', () => { robotErrorDrive(); });
socket.on('robot-error-charge', () => { robotErrorCharge(); });
socket.on('robot-disconnected', () => { robotDisconnected(); });
socket.on('robot-connected', () => { robotConnected(); });


// ==========================================
// FUNCTIE DEFINITIES
// ==========================================

function robotStartup() {
    changeScreen('robot-startup-screen');
}

function robotLostCharging() {
    changeScreen('robot-lost-charging');
}

function robotExplore() {
    changeScreen('robot-explore-screen');

    const interval = setInterval(() => {
        if (document.querySelector('#robot-explore-screen').style.display === 'none') {
            clearInterval(interval);
            return;
        }
        let selectedLanguageIndex = 0;
        document.querySelectorAll('.language-selector').forEach((el, index) => {
            if (el.classList.contains('selected-language')) {
                selectedLanguageIndex = index;
            }
        });
        document.querySelectorAll('.language-selector')[(selectedLanguageIndex + 1) % 3].click();
    }, 2100);
}

function robotGoToVisitors() {
    changeScreen('robot-go-to-visitors-screen');

    const interval = setInterval(() => {
        if (document.querySelector('#robot-go-to-visitors-screen').style.display === 'none') {
            clearInterval(interval);
            return;
        }
        let selectedLanguageIndex = 0;
        document.querySelectorAll('.language-selector').forEach((el, index) => {
            if (el.classList.contains('selected-language')) {
                selectedLanguageIndex = index;
            }
        });
        document.querySelectorAll('.language-selector')[(selectedLanguageIndex + 1) % 3].click();
    }, 2100);
}

function robotArrivedAtVisitors() {
    document.querySelector('#NL-selector').click();
    changeScreen('start-screen');

    if (Quiz.timeToStartQuiz > 0) {
        console.log('Waiting for quiz to start...');
        setTimeout(() => {
            console.log(`Quiz inactive: ${document.querySelector('#start-screen').style.display === 'block'}`);
            if (document.querySelector('#start-screen').style.display === 'block') {
                socket.emit('quiz-inactive');
            }
        }, Quiz.timeToStartQuiz * 1000);
    }
}

async function robotArrivedAtQuizLocation() {
    console.log('Robot has arrived at the quiz location!');
    try {
        await Quiz.start();
    } catch (e) {
        error(e);
        return;
    }
}

function robotGoCharge() {
    changeScreen('robot-go-charge-screen');
}

function robotDocking() {
    console.log('Docking ontvangen');
    changeScreen('robot-docking-screen');
}

function robotCharging() {
    changeScreen('robot-charging-screen');
}

function robotErrorDrive() {
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>Hugoo is verdwaald...</h1><p>Gelieve dit aan het onthaal te melden.</p>`;
}

function robotErrorCharge() {
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>Hugoo kan het laadstation niet vinden.</h1><p>Open het admin-paneel, ga naar diagnose en volg daar de rebootprocedure.</p>`;
}

function robotDisconnected() {
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>De verbinding met het besturingssysteem is verloren gegaan.</h1><p>Even geduld aub...</p>`;
}

function robotConnected() {
    changeScreen('robot-startup-screen');
}