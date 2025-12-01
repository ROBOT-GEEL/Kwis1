// Store references to elements once.
const mainElement = document.querySelector('main');
const questionElement = document.querySelector('#question');
const answerTextElements = document.querySelectorAll('.answer-text');
const answerElements = document.querySelectorAll('.answer');
const timerSpanElement = document.querySelector('#timer span');
const timerProgressElement = document.querySelector('#timer progress');

// io() connects to the host that served the page (works with http/https and ports).
const socket = io();





// Global timer variable
let countdownInterval = null;

/**
 * Constant for textFit options.
 */
const textFitOptions = {
    multiLine: true,
    reProcess: true,
    alignHoriz: true,
    alignVert: true
};

/**
 * Helper function to remove 'correct'/'wrong' classes from all answers.
 */
const clearAnswerClasses = () => {
    answerElements.forEach(e => e.classList.remove('correct-answer', 'wrong-answer'));
};

/**
 * Starts a simple local countdown on the projector.
 *
 * This avoids relying on the system clocks of different devices
 * (quiz screen vs. projector). If those clocks are out of sync,
 * a timestamp‑based countdown can immediately jump to 0.
 */
const startLocalCountdown = (answerTime) => {
    // Stop any previous countdown
    clearInterval(countdownInterval);

    let remainingTime = answerTime;

    // Initial render
    timerSpanElement.textContent = `${remainingTime}s`;
    timerProgressElement.value = 100;

    countdownInterval = setInterval(() => {
        remainingTime -= 1;

        if (remainingTime <= 0) {
            remainingTime = 0;
            clearInterval(countdownInterval);
        }

        timerSpanElement.textContent = `${remainingTime}s`;

        const percentage = answerTime > 0
            ? Math.max(0, Math.min(100, (remainingTime / answerTime) * 100))
            : 0;
        timerProgressElement.value = percentage;
    }, 1000);
};

// --- Socket.io Event Listeners ---

socket.on('connect', () => {
    console.log('Connected to socket.io server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket.io server');
    // Ensure the timer stops on disconnect
    clearInterval(countdownInterval);
});



socket.on('projector-update-question', (data) => {
    mainElement.classList.remove('hidden');
    questionElement.innerHTML = data.question;

    answerTextElements.forEach((element, index) => {
        element.innerHTML = data.answers[index];
    });

    // Use the cached elements and reusable options
    textFit(questionElement, textFitOptions);
    textFit(answerTextElements, textFitOptions);
});

socket.on('projector-start-countdown', (data) => {
    const { answerTime } = data;
    // Use a purely local countdown to avoid cross‑device clock issues.
    startLocalCountdown(answerTime);
});

socket.on('projector-display-answers', (data) => {
    // Use the cached elements
    const correctAnswerId = `answer-${data.answer}`;

    answerElements.forEach(el => {
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
    mainElement.classList.add('hidden');
    clearAnswerClasses();

    questionElement.innerHTML = '';
    answerTextElements.forEach(e => e.innerHTML = '');

    timerSpanElement.textContent = '';
    timerProgressElement.value = 0;

    // Stop the timer on reset
    clearInterval(countdownInterval);
});
