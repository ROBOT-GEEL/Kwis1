// Store references to the main screens
const inactiveScreenElement = document.querySelector('#inactive-screen');
const instruction1ScreenElement = document.querySelector('#instruction-1-screen');
const instruction2ScreenElement = document.querySelector('#instruction-2-screen');
const endScreenElement = document.querySelector('#end-screen');
const startScreenElement = document.querySelector('#start-screen');
const quizScreenElement = document.querySelector('#projector-quiz');
const statsScreenElement = document.querySelector('#stats-screen');
const countingScreenElement = document.querySelector('#counting-screen');

// Store references to dynamic quiz elements
const questionElement = document.querySelector('#question');
const answerTextElements = document.querySelectorAll('.answer-text');
const answerContainers = document.querySelectorAll('.answer-container');
const quizRemainingQuestionsElement = document.querySelector('#quiz-remaining-questions');
const timerSpanElement = document.querySelector('#timer span');
const timerProgressElement = document.querySelector('#timer progress');

// Text elements for instructions and endscreen
const instruction1Text = document.querySelector('#instruction-1-text');
const instruction2Text = document.querySelector('#instruction-2-text');
const endText = document.querySelector('#end-text');
const startText = document.querySelector('#start-text');

// Text elements for stats&counting screen
const statsText = document.querySelector('#stats-text');
const statsGetal = document.querySelector('#stats-getal');
const countingText = document.querySelector('#counting-text');

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
    statsScreenElement.classList.add('hidden');
    countingScreenElement.classList.add('hidden');
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
    quizRemainingQuestionsElement.innerHTML = `${data.remainingQuestionsText} ${data.currentQuestion}/${data.totalQuestions}`;
    
    // Reset the font size to a very small value before applying textFit
    answerTextElements.forEach((element, index) => {
        element.style.fontSize = '1px';
        element.innerHTML = data.answers[index];
    });

    hideAllScreens();
    quizScreenElement.classList.remove('hidden');

    //Wacht tot lettertypes geladen zijn en geef de browser tijd om te renderen
    document.fonts.ready.then(() => {
        // requestAnimationFrame vertelt de browser: doe dit pas bij de volgende frame-update
        requestAnimationFrame(() => {
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
    });
});

socket.on('projector-update-countdown', (data) => {
    const { remainingTime, answerTime, remainingTimeText } = data;

    // Als remainingTimeText 'undefined' is, maken we er een lege string van, anders gebruiken we de tekst.
    const text = remainingTimeText || '';

    timerSpanElement.textContent = `${remainingTime} ${text}`;

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

socket.on('projector-show-counting-screen', (data) => {
    const instructionText = data.instruction;

    countingText.innerHTML = instructionText;

    hideAllScreens();
    countingScreenElement.classList.remove('hidden');
});

socket.on('projector-show-stats-screen', (data) => {
    const stats = data.stats;
    console.log(stats);
    
    let procent = 0; 
    if (stats.total > 0) {
        procent = Math.round((stats.totalCorrect / stats.total) * 100);
    }

    statsGetal.innerHTML = `${procent}%`; // Voeg meteen een procentteken toe

    if (procent >= 90){
        statsText.innerHTML = data.instruction_Superb;    
    } else if (procent >= 50){
        statsText.innerHTML = data.instruction_Good;    
    } else if (procent >= 25){
        statsText.innerHTML = data.instruction_Moderate;    
    } else if (procent >= 0){
        statsText.innerHTML = data.instruction_Bad;    
    }  

    hideAllScreens();
    statsScreenElement.classList.remove('hidden');
});
