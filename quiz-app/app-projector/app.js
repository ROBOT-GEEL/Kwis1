// Store references to the 4 main screens
const inactiveScreenElement = document.querySelector('#inactive-screen');
const instruction1ScreenElement = document.querySelector('#instruction-1-screen');
const instruction2ScreenElement = document.querySelector('#instruction-2-screen');
const quizScreenElement = document.querySelector('#projector-quiz');

// Store references to dynamic quiz elements
const questionElement = document.querySelector('#question');
const answerTextElements = document.querySelectorAll('.answer-text');
const answerContainers = document.querySelectorAll('.answer-container');
const timerSpanElement = document.querySelector('#timer span');
const timerProgressElement = document.querySelector('#timer progress');

// Text elements for instructions (so we can apply textFit to them)
const instruction1Text = document.querySelector('#instruction-1-text');
const instruction2Text = document.querySelector('#instruction-2-text');

// Connect to localhost (server and website run on the same device)
const socket = io(); 

// Global variables for intervals and timeouts
let countdownInterval = null;
let instructionTimeout = null;

const textFitOptions = {
    multiLine: true,
    reProcess: true,
    alignHoriz: true,
    alignVert: true
};

/**
 * Helper function to hide all screens before showing a specific one.
 */
const hideAllScreens = () => {
    inactiveScreenElement.classList.add('hidden');
    instruction1ScreenElement.classList.add('hidden');
    instruction2ScreenElement.classList.add('hidden');
    quizScreenElement.classList.add('hidden');
};

/**
 * Helper function to remove 'correct'/'wrong' classes from all answer containers.
 */
const clearAnswerClasses = () => {
    answerContainers.forEach(e => e.classList.remove('correct-answer', 'wrong-answer'));
};

// --- Socket.io Event Listeners ---

socket.on('connect', () => {
    console.log('Connected to socket.io server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket.io server');
    clearInterval(countdownInterval);
    clearTimeout(instructionTimeout);
});

socket.on('projector-show-instructions-1', () => {
    hideAllScreens();
    instruction1ScreenElement.classList.remove('hidden');
});

socket.on('projector-show-instructions-2', () => {
    hideAllScreens();
    instruction2ScreenElement.classList.remove('hidden');
});

socket.on('projector-update-question', (data) => {
    clearTimeout(instructionTimeout);

    questionElement.innerHTML = data.question;
    answerTextElements.forEach((element, index) => {
        element.innerHTML = data.answers[index];
    });

    // 1. Maak het quiz scherm zichtbaar
    hideAllScreens();
    quizScreenElement.classList.remove('hidden');

    // 2. WACHT op de render
    setTimeout(() => {
        textFit(questionElement, textFitOptions);
        textFit(answerTextElements, textFitOptions);
    }, 50);
});

socket.on('projector-update-countdown', (data) => {
    const { remainingTime, answerTime } = data;

    timerSpanElement.textContent = `${remainingTime}s`;

    const percentage = answerTime > 0
        ? Math.max(0, Math.min(100, (remainingTime / answerTime) * 100))
        : 0;
    timerProgressElement.value = percentage;
});

socket.on('projector-display-answers', (data) => {
    const correctAnswerId = `answer-${data.answer}-container`;

    answerContainers.forEach(el => {
        if (el.id === correctAnswerId) {
            el.classList.add('correct-answer');
        } else {
            el.classList.add('wrong-answer');
        }
    });
});

socket.on('projector-clear-answers', () => {
    clearAnswerClasses();
});

socket.on('projector-reset', () => {
    hideAllScreens();
    inactiveScreenElement.classList.remove('hidden');
    
    clearAnswerClasses();
    clearInterval(countdownInterval);
    clearTimeout(instructionTimeout);

    questionElement.innerHTML = '';
    answerTextElements.forEach(e => e.innerHTML = '');

    timerSpanElement.textContent = '';
    timerProgressElement.value = 0;
});