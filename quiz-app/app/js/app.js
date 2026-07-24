/**
 * Script for the client-side of the Quiz Robot application.
 * This is the main entry point.
 *
 * Depends on:
 * - socket.io (external library)
 * - language.js (LanguageData)
 * - quiz.js (Quiz)
 * - utils.js (changeScreen)
 * - error.js (error)
 * - debug.js (Debug) - (conditionally)
 */

window.socket = io(`ws://${window.location.hostname}`);

/**
 * Callback function to call when the language changes.
 *
 * It updates most of the content of the frontend.
 */
function onLanguageChange() {
    // Start screen
    document.querySelector('[data-lang-key=START_SCREEN_HEADER]').innerHTML = LanguageData.get("START_SCREEN_HEADER");
    document.querySelector('[data-lang-key=START_SCREEN_START_BUTTON]').innerHTML = LanguageData.get("START_SCREEN_START_BUTTON");
    document.querySelector('[data-lang-key=FOLLOW_SCREEN_TEXT]').innerHTML = LanguageData.get("FOLLOW_SCREEN_TEXT");

    // Update the quiz finished screen
    document.querySelector('[data-lang-key=QUIZ_FINISHED_HEADER]').innerHTML = LanguageData.get("QUIZ_FINISHED_HEADER");
    document.querySelector('[data-lang-key=QUIZ_FINISHED_DESCRIPTION]').innerHTML = LanguageData.get("QUIZ_FINISHED_DESCRIPTION");

    // easy questions modal
    document.querySelector('[data-lang-key=EASY_QUESTIONS_MODAL_HEADER]').innerHTML = LanguageData.get("EASY_QUESTIONS_MODAL_HEADER");
    document.querySelector('[data-lang-key=EASY_QUESTIONS_MODAL_YES]').innerHTML = LanguageData.get("EASY_QUESTIONS_MODAL_YES");
    document.querySelector('[data-lang-key=EASY_QUESTIONS_MODAL_NO]').innerHTML = LanguageData.get("EASY_QUESTIONS_MODAL_NO");

    // easy questions modal
    document.querySelector('[data-lang-key=VISITED_EXPOO_MODAL_HEADER]').innerHTML = LanguageData.get("VISITED_EXPOO_MODAL_HEADER");
    document.querySelector('[data-lang-key=VISITED_EXPOO_MODAL_YES]').innerHTML = LanguageData.get("VISITED_EXPOO_MODAL_YES");
    document.querySelector('[data-lang-key=VISITED_EXPOO_MODAL_NO]').innerHTML = LanguageData.get("VISITED_EXPOO_MODAL_NO");

    // Exploring
    document.querySelector('[data-lang-key=EXPLORING]').innerHTML = LanguageData.get("EXPLORING");

    // Quiz instructions
    document.querySelector('[data-lang-key=QUIZ_INSTRUCTIONS_HEADER]').innerHTML = LanguageData.get("QUIZ_INSTRUCTIONS_HEADER");
    document.querySelector('[data-lang-key=QUIZ_INSTRUCTIONS_DESCRIPTION]').innerHTML = LanguageData.get("QUIZ_INSTRUCTIONS_DESCRIPTION");

    // Melding die zegt dat je niet via het scherm kan antwoorden
    document.querySelector('[data-lang-key=NO_ANSWER_VIA_SCREEN_MESSAGE]').innerHTML = LanguageData.get("NO_ANSWER_VIA_SCREEN_MESSAGE");
}

// Register the callback function for the language change
LanguageData.addLanguageChangeCallback(() => onLanguageChange());

/////////////////////
// EVENT LISTENERS //
/////////////////////
/**
 * Event listener for the document's DOMContentLoaded event.
 *
 * This event listener does the following:
 * - Update the language data
 * - Call the onLanguageChange function
 * - Update the time to start the quiz
 * - Change the screen to the start screen
 */
document.addEventListener('DOMContentLoaded', async () => {
    await LanguageData.update();
    onLanguageChange();

    try {
        Quiz.updateTimeToStartQuiz();
    } catch (e) {
        error(e);
        return;
    }

    changeScreen('robot-startup-screen');
    // if (Debug.ENABLED) {
    //     changeScreen('start-screen');
    //     socket.off('robot-explore');
    //     socket.off('robot-go-to-visitors');
    //     socket.off('robot-arrived-at-visitors');
    // } else {
    //     changeScreen('robot-startup-screen');
    // }
});

/**
 * Event listener for the start button on the start screen.
 *
 * This event listener shows the modal to ask if the participants want easy questions.
 */
document.querySelector('#play-quiz-button').addEventListener('click', async () => {
    document.querySelector('#easyvisited-questions-modal').style.display = 'block';
});

/**
 * Event listener for the close button on the easy questions modal.
 *
 * This event listener closes the modal.
 */
document.querySelector('#close-modal-btn').addEventListener('click', () => {
    document.querySelector('#easyvisited-questions-modal').style.display = 'none';
});

/**
 * Event listener for easy questions and visited
 */
document.querySelector('#easy-questions-yes').addEventListener('click', () => {
    toggleEasyVisitedButtons("easy", true);
});

document.querySelector('#easy-questions-no').addEventListener('click', () => {
    toggleEasyVisitedButtons("easy", false);
});

document.querySelector('#visited-expoo-yes').addEventListener('click', () => {
    toggleEasyVisitedButtons("visited", true); 
});

document.querySelector('#visited-expoo-no').addEventListener('click', () => {
    toggleEasyVisitedButtons("visited", false); 
});

let wantEasyQuestion = null;
let hasVisited = null; 

async function toggleEasyVisitedButtons(easyVisited, state) {
    const easyQuestionYes = document.querySelector('#easy-questions-yes');
    const easyQuestionNo = document.querySelector('#easy-questions-no');
    const visitedYes = document.querySelector('#visited-expoo-yes');
    const visitedNo = document.querySelector('#visited-expoo-no');

    if (easyVisited === "easy") {
        if (state) {
            easyQuestionYes.classList.add('modal-buttons-clicked');
            easyQuestionNo.classList.remove('modal-buttons-clicked');
            wantEasyQuestion = true;
        } else {
            easyQuestionYes.classList.remove('modal-buttons-clicked');
            easyQuestionNo.classList.add('modal-buttons-clicked');
            wantEasyQuestion = false;
        }
    } 
    else if (easyVisited === "visited") {
        if (state) {
            visitedYes.classList.add('modal-buttons-clicked');
            visitedNo.classList.remove('modal-buttons-clicked');
            hasVisited = true; 
        } else {
            visitedYes.classList.remove('modal-buttons-clicked');
            visitedNo.classList.add('modal-buttons-clicked');
            hasVisited = false;
        }
    }

    if ((wantEasyQuestion !== null) && (hasVisited !== null)) {

        setTimeout(async () => {
            document.querySelector('#easyvisited-questions-modal').style.display = 'none';
            easyQuestionYes.classList.remove('modal-buttons-clicked');
            easyQuestionNo.classList.remove('modal-buttons-clicked');
            visitedYes.classList.remove('modal-buttons-clicked');
            visitedNo.classList.remove('modal-buttons-clicked');
            
            Quiz.easyQuestion = wantEasyQuestion;
            Quiz.visited = hasVisited;

            hasVisited = null;
            wantEasyQuestion = null;

            changeScreen('follow-robot-screen');
            socket.emit('drive-to-quiz-location');
            
            try {
                await Quiz.initializeNewQuiz();
            } catch (e) {
                error(e);
                return;
            }
        }, 1500); // <-- Hier stel je de vertraging in
    }
}

/**
 * Event listener for the easy questions modal buttons.
 * (YES)

document.querySelector('#easy-questions-yes').addEventListener('click', async () => {
    document.querySelector('#easy-questions-modal').style.display = 'none';
    Quiz.easyQuestion = true;
    changeScreen('follow-robot-screen');
    socket.emit('drive-to-quiz-location');
    try {
        await Quiz.initializeNewQuiz();
    } catch (e) {
        error(e);
        return;
    }
});

/**
 * Event listener for the easy questions modal buttons.
 * (NO)

document.querySelector('#easy-questions-no').addEventListener('click', async () => {
    document.querySelector('#easy-questions-modal').style.display = 'none';
    Quiz.easyQuestion = false;
    changeScreen('follow-robot-screen');
    socket.emit('drive-to-quiz-location');
    try {
        await Quiz.initializeNewQuiz();
    } catch (e) {
        error(e);
        return;
    }
});*/

/**
 * Event listener for the error close button.
 */
document.querySelector('#error-close').addEventListener('click', () => {
    socket.emit('quiz-finished');
    changeScreen('start-screen');
    document.querySelector('#error').close();
});
