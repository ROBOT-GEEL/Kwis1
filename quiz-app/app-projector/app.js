// Store references to the main screens
const inactiveScreenElement = document.querySelector('#inactive-screen');
const instruction1ScreenElement = document.querySelector('#instruction-1-screen');
const instruction2ScreenElement = document.querySelector('#instruction-2-screen');
const endScreenElement = document.querySelector('#end-screen');
const startScreenElement = document.querySelector('#start-screen');
const quizScreenElement = document.querySelector('#projector-quiz');

// Store references to dynamic quiz elements
const questionElement = document.querySelector('#question');
const answerTextElements = document.querySelectorAll('.answer-text');
const answerContainers = document.querySelectorAll('.answer-container');
const timerSpanElement = document.querySelector('#timer span');
const timerProgressElement = document.querySelector('#timer progress');

// Text elements for instructions and endscreen
const instruction1Text = document.querySelector('#instruction-1-text');
const instruction2Text = document.querySelector('#instruction-2-text');
const endText = document.querySelector('#end-text');
const startText = document.querySelector('#start-text');

const socket = io(); 

// Global variables for intervals and timeouts
let countdownInterval = null;
let instructionTimeout = null;

/**
 * Helper function to hide all screens before showing a specific one.
 */
const hideAllScreens = () => {
    inactiveScreenElement.classList.add('hidden');
    instruction1ScreenElement.classList.add('hidden');
    instruction2ScreenElement.classList.add('hidden');
    quizScreenElement.classList.add('hidden');
    endScreenElement.classList.add('hidden');
    startScreenElement.classList.add('hidden');
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

socket.on('projector-show-instructions-1', (data) => {
    const instructionText = data.instruction;

    instruction1Text.innerHTML = instructionText;

    hideAllScreens();
    instruction1ScreenElement.classList.remove('hidden');

});

socket.on('projector-show-instructions-2', (data) => {
    const instructionText = data.instruction;

    instruction2Text.innerHTML = instructionText;

    hideAllScreens();
    instruction2ScreenElement.classList.remove('hidden');
});

socket.on('projector-show-start-screen', (data) => {
    const instructionText = data.instruction;

    startText.innerHTML = instructionText;

    hideAllScreens();
    startScreenElement.classList.remove('hidden');
});

socket.on('projector-show-end-screen', (data) => {
    const instructionText = data.instruction;

    endText.innerHTML = instructionText;

    hideAllScreens();
    endScreenElement.classList.remove('hidden');
});

socket.on('projector-update-question', (data) => {
    clearTimeout(instructionTimeout);

    questionElement.innerHTML = data.question;
    
    // Reset the font size to a very small value before applying textFit
    answerTextElements.forEach((element, index) => {
        element.style.fontSize = '1px';
        element.innerHTML = data.answers[index];
    });

    hideAllScreens();
    quizScreenElement.classList.remove('hidden');

    // Fit the question
    textFit(questionElement, {
        minFontSize: 4,
        maxFontSize: 200,
        multiLine: true,
        reProcess: true,
        alignHoriz: true,
        alignVert: true
    });
    
    // Fit all the answers
    textFit(answerTextElements, {
        minFontSize: 4,
        maxFontSize: 200,
        multiLine: true,
        reProcess: true,
        alignHoriz: true,
        alignVert: false
    });

    // Search for the smallest calculated font size among the answers
    let minCalculatedSize = 200;
    const fittedTexts = document.querySelectorAll('.answer-text .textFitted');
    
    fittedTexts.forEach(fittedElement => {
        const currentSize = parseFloat(fittedElement.style.fontSize);
        if (currentSize && currentSize < minCalculatedSize) {
            minCalculatedSize = currentSize;
        }
    });

    // Apply the smallest calculated font size to all answers
    fittedTexts.forEach(fittedElement => {
        fittedElement.style.fontSize = minCalculatedSize + 'px';
    });
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