/**
 * Class to handle the quiz functionality.
 * Depends on:
 * - app.js (socket)
 * - language.js (LanguageData)
 * - utils.js (wait, changeScreen)
 * - error.js (logError, error)
 * - textFit.js (external library)
 */
class Quiz {
    static #answerTime = 10;
    static #maxQuestions = 3;
    static #questions = [];
    static #currentQuestionIndex = 0;
    static #remainingAnswerTime;
    static #quizId = null;
    static easyQuestion = true;        // Whether the participants chose to have easy questions
    static visited = false;             // Whether the participants have visited the expoo or not
    static #nextQuestionDelay = 3;      // The delay between the end of the answer and the start of the next question
    static #cancelInactiveQuiz = true;  // Whether to cancel the quiz if there are no people in the answer zones
    static #inactiveQuizCounter = 0;
    static #instructionsScreenTime = 5; // The time to show the instructions screen
    static #finishedScreenTime = 5;     // The time to show the finished screen
    static #cancelled = false;
    static #active = false;
    static #isInitialized = false;
    static #instructions = [];
    static timeToStartQuiz = 0;

    static {
        // Add a language change callback to update the quiz screen
        LanguageData.addLanguageChangeCallback(() => this.onLanguageChange());

        // Add event listener for the people count from the Pi
        // This is used to cancel the quiz if there are no people in the answer zones twice in a row
        socket.on('pi-count-people-answer', async (data) => {

            // Check if the current quiz is the same as the one that was counted
            if (this.#quizId === data.quizId) {
                // Increment the inactive quiz counter if there are no people in the answer zones
                if (Array.isArray(data.results) && data.results.reduce((a, b) => a + b, 0) === 0) {
                    this.#inactiveQuizCounter++;
                } else {
                    this.#inactiveQuizCounter = 0;
                }
            } else {
                this.#inactiveQuizCounter = 0;
            }

            // If there are no people in the answer zones twice in a row and the quiz is allowed to be cancelled, cancel the quiz
            if (this.#inactiveQuizCounter >= 2 && this.#cancelInactiveQuiz) {
                this.#cancelled = true;
                this.#currentQuestionIndex = this.#questions.length;
                socket.emit('projector-reset');
                changeScreen('quiz-finished-screen');
                await wait(this.#finishedScreenTime * 1000);
                socket.emit('quiz-finished');
                return;
            }

            // If the count went wrong, cleanly abort the quiz
            if (data.status !== "success") {
                await this.#abortQuiz(data.error_code);
                return;
            }
        });

        socket.on("robot-disconnected", async () => {
            await this.#abortQuiz("ROBOT_DISCONNECTED");
        });

    }

    /**
     * Initialize a new quiz.
     *
     * This function does the following:
     * - Get a new quiz ID from the server
     * - Update the quiz parameters from the server
     * - Get the questions from the server
     * - Get the instructions from the server
     * - Shows start screen on projector
     */
    static async initializeNewQuiz() {
        this.#isInitialized = false;
        this.#quizId = await this.#getNewId();
        await this.#updateParameters();
        this.#questions = await this.#getQuestions();
        this.#instructions = await this.#getInstructions();
        await this.updateTimeToStartQuiz();
        this.#isInitialized = true;

        this.#prepareProjectorForQuiz();
    }

    /**
     * Get a new quiz ID from the server.
     *
     * @returns {string} The new quiz ID
     * @throws If there was an error fetching the quiz ID
     * @throws If the response status was not OK
     */
    static async #getNewId() {
        let response;
        try {
            response = await fetch('/quiz/new-id');
        } catch {
            logError("[Quiz Interface] Network error while fetching a new quiz ID");
            throw "ERROR_QUIZ_ID_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching new quiz ID: " + response.status);
            throw "ERROR_QUIZ_ID_STATUS";
        }
        const data = await response.json();
        return data.quizId;
    }

    /**
     * Update the quiz parameters from the server.
     *
     * @throws If there was an error fetching the parameters
     * @throws If the response status was not OK
     */
    static async #updateParameters() {
        let response;
        try {
            response = await fetch('/quiz/parameters');
        } catch {
            logError("[Quiz Interface] Network error while fetching quiz parameters");
            throw "ERROR_PARAMETERS_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching quiz parameters: " + response.status);
            throw "ERROR_PARAMETERS_STATUS";
        }
        const data = await response.json();
        this.#answerTime = data.answerTime;
        this.#maxQuestions = data.maxQuestions;
        this.#nextQuestionDelay = data.nextQuestionDelay;
        this.#cancelInactiveQuiz = data.cancelInactiveQuiz;
        this.#instructionsScreenTime = data.instructionsScreenTime;
        this.#finishedScreenTime = data.finishedScreenTime;
    }

    /**
     * Get questions from the server.
     *
     * @returns {Array} An array of questions
     * @throws If there was an error fetching the questions
     * @throws If the response status was not OK
     */
    static async #getQuestions() {
        let response;
        try {
            response = await fetch('/quiz/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    easyQuestion: this.easyQuestion,
                    amount: this.#maxQuestions
                })
            });
        } catch {
            logError("[Quiz Interface] Network error while fetching quiz questions");
            throw "ERROR_QUESTIONS_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching quiz questions: " + response.status);
            throw "ERROR_QUESTIONS_STATUS";
        }
        const data = await response.json();
        return data;
    }

    /**
     * Get the instructions from the server.
     *
     * @returns {Array} An array of instructions
     * @throws If there was an error fetching the instructions
     * @throws If the response status was not OK
     */
    static async #getInstructions() {
        let response;
        try {
            response = await fetch('/quiz/instructions');
        } catch {
            logError("[Quiz Interface] Network error while fetching quiz instructions");
            throw "ERROR_INSTRUCTIONS_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching quiz instructions: " + response.status);
            throw "ERROR_INSTRUCTIONS_STATUS";
        }
        const data = await response.json();
        return data;
    }

    static async #getTimeToStartQuiz() {
        let response;
        try {
            response = await fetch('/quiz/time-to-start');
        } catch {
            logError("[Quiz Interface] Network error while fetching time to start quiz");
            throw "ERROR_PARAMETERS_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching time to start quiz: " + response.status);
            throw "ERROR_PARAMETERS_STATUS";
        }
        const data = await response.json();
        return data.time;
    }

    static async updateTimeToStartQuiz() {
        this.timeToStartQuiz = await this.#getTimeToStartQuiz();
    }

    /**
     * Aborts the quiz due to an error, resets the projector, and shows an error message.
     *
     * @param {string} errorCode - The error code to display in the error message
     */

    static async abortByScreenChange(message="Ander scherm ontvangen"){
        if (this.#active){
            socket.emit('quiz-finished');

            if (this.#cancelled) return; 
            
            this.#cancelled = true;
            this.#currentQuestionIndex = this.#questions.length; // Break out of any running question loops

            // Reset projector state
            socket.emit('projector-reset');

            // Turn off the projector lens
            try {
                await this.#sendProjectorCommand("sleep");
            } catch (e) {
                logError("[Quiz Interface] Could not turn off projector lens during error handling.");
            }  

        }
    }

    static async #abortQuiz(errorCode) {
        // Prevent multiple error triggers from running simultaneously

        console.log("[Quiz Interface] Aborting quiz due to error: " + errorCode);
        if (this.#cancelled) return; 
        
        this.#cancelled = true;
        this.#currentQuestionIndex = this.#questions.length; // Break out of any running question loops

        // Reset projector state
        socket.emit('projector-reset');

        // Turn off the projector lens
        try {
            await this.#sendProjectorCommand("sleep");
        } catch (e) {
            logError("[Quiz Interface] Could not turn off projector lens during error handling.");
        }
        
        error(errorCode);
    }

    /**
     * Sends a command to toggle the projector state.
     * 
     * @param {string} action - The action to perform ("wake" or "sleep")
     */
    static async #sendProjectorCommand(action) {
        let response;
        try {
            response = await fetch("/projector-control/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectorState: action })
            });
        } catch (error) {
            logError("[Quiz Interface] Network error while toggling projector");
            throw "ERR_CONTROLLER_UNREACHABLE";
        }

        const data = await response.json();

        if (!response.ok) {
            logError("[Quiz Interface] Error toggling projector: " + response.status);

            if (response.status === 502) {
                const errorCode = data.details || "GENERAL_CONNECTION_ERROR";
                const cleanCode = errorCode.replace("ERROR: ", "").trim();
                throw cleanCode;
            } else {
                throw "ERR_CONTROLLER_UNREACHABLE"; 
            }
        }

        return data;
    }

    static async #prepareProjectorForQuiz() {
        this.#showProjectorStartScreen();
        await this.#sendProjectorCommand("wake");
    }

    static async start() {
        try {
            // If the quiz is not initialized, wait for it to be initialized
            while (!this.#isInitialized) {
                await wait(100);
            }
            // Reset the cancelled flag
            this.#cancelled = false;

            await this.#showInstructions();

            // Change the screen to the quiz screen after the instructions
            // Dit gebruiken we niet meer zodat mensen niet op het scherm van de robot willen drukken om te antwoorden
            changeScreen('quiz-screen');
            
            // Set the quiz as active for the language change callback
            this.#active = true;

            // Loop through the questions
            for (this.#currentQuestionIndex = 0; this.#currentQuestionIndex < this.#questions.length; this.#currentQuestionIndex++) {
                
                // If the quiz was cancelled due to an error, break the loop
                if (this.#cancelled) break;

                this.#showQuestion();
                await this.#answerCountdown();

                // If the quiz was cancelled due to an error, break the loop
                if (this.#cancelled) break;

                // Notify the Pi to count the people in the answer zones
                socket.emit('pi-count-people', { quizId: this.#quizId, questionId: this.#questions[this.#currentQuestionIndex].questionId, hasVisited: this.visited });
                this.#showCorrectAnswer();

                // Wait until showing the next question
                await wait(this.#nextQuestionDelay * 1000);

                // Clear the answers on the projector
                socket.emit('projector-clear-answers');

                // Reset the correct/wrong answer classes
                document.querySelectorAll('.answer-container').forEach(e => e.classList.remove('wrong-answer-container', 'correct-answer-container'));
                document.querySelectorAll('.answer-label').forEach(e => e.classList.remove('correct-answer-label', 'wrong-answer-label'));
                
                 // If the quiz was cancelled due to an error, break the loop
                if (this.#cancelled) break;
            }

            // Set the quiz as inactive for the language change callback
            this.#active = false;
            // Clear the questions array
            this.#questions = [];

            // Finish the quiz if it was not cancelled (Normal completion)
            if (!this.#cancelled) {
                changeScreen('quiz-finished-screen');
                this.#showProjectorCounting();
                await wait(3000);
                this.#showProjectorStats();
                await wait(this.#finishedScreenTime * 1000);
                this.#showProjectorEndScreen();
                await wait(this.#finishedScreenTime * 1000);
                await this.#sendProjectorCommand("sleep");
                socket.emit('projector-reset');
                socket.emit('quiz-finished');
            }
        } catch (errorCode) { 
            logError("[Quiz Runtime Error] An error occurred during the quiz execution");
            await this.#abortQuiz(errorCode);
        };
    }

    static async #showInstructions() {        
        changeScreen('quiz-instructions-screen');

        // Notify the Orin Nano to show the first instructions screen on the projector
        socket.emit('projector-show-instructions-1', {
            instruction: this.#instructions['instruction_1'][LanguageData.selectedLanguage]
        });

        // Wait half the time for the instructions to be shown before showing the second instructions screen
        await wait(this.#instructionsScreenTime / 2 * 1000);

        socket.emit('projector-show-instructions-2', {
            instruction: this.#instructions['instruction_2'][LanguageData.selectedLanguage]
        });

        await wait(this.#instructionsScreenTime / 2 * 1000);
    }

    static async #showProjectorStartScreen(){
        socket.emit('projector-show-start-screen', {
            instruction: this.#instructions['startScreen'][LanguageData.selectedLanguage]
        });
    }

    static async #showProjectorEndScreen(){
        socket.emit('projector-show-end-screen', {
            instruction: this.#instructions['endScreen'][LanguageData.selectedLanguage]
        });
    }

    static async #showProjectorStats(){
        const statsData = await this.#getProjectorStats();
        socket.emit('projector-show-stats-screen', {
            instruction_Superb: this.#instructions['statsScreen_Superb'][LanguageData.selectedLanguage],
            instruction_Good: this.#instructions['statsScreen_Good'][LanguageData.selectedLanguage],
            instruction_Moderate: this.#instructions['statsScreen_Moderate'][LanguageData.selectedLanguage],
            instruction_Bad: this.#instructions['statsScreen_Bad'][LanguageData.selectedLanguage],
            stats: statsData
        });
    }

    static async #showProjectorCounting(){       
        socket.emit('projector-show-counting-screen', {
            instruction: this.#instructions['countingScreen'][LanguageData.selectedLanguage],
        });
    }

    /**
     * Get statistics for the current quiz from the server.
     *
     * @returns {Object} An object containing { total, totalCorrect }
     */
    static async #getProjectorStats() {
        let response;
        try {
            response = await fetch('/quiz/getstatisticsforprojector', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quizId: this.#quizId
                })
            });
        } catch {
            logError("[Quiz Interface] Network error while fetching quiz statistics");
            throw "ERROR_STATISTICS_FETCH";
        }
        if (!response.ok) {
            logError("[Quiz Interface] Error fetching quiz statistics: " + response.status);
            throw "ERROR_STATISTICS_STATUS";
        }
        const data = await response.json();
        return data;
    }

    /**
     * Show the current question.
     *
     * This function does the following:
     * - Emit the question data to the projector
     * - Show the question and answers on the quiz screen
     * - Update the remaining questions
     */
    static #showQuestion() {
        const question = this.#questions[this.#currentQuestionIndex][LanguageData.selectedLanguage.toLowerCase()].question;
        const answers = this.#questions[this.#currentQuestionIndex][LanguageData.selectedLanguage.toLowerCase()].answers;
        const remainingQuestionsText = this.#instructions['remainingQuestions'][LanguageData.selectedLanguage];

        // Emit the question data to the projector
        socket.emit('projector-update-question', {
            question: question,
            answers: answers, 
            remainingQuestionsText: remainingQuestionsText,
            currentQuestion: this.#currentQuestionIndex + 1,
            totalQuestions: this.#maxQuestions
        });

        // Show the question
        document.querySelector('[data-lang-key=QUIZ_SCREEN_QUESTION]').innerHTML = LanguageData.get("QUIZ_SCREEN_QUESTION").replace('%question%', question);
        textFit(document.querySelector('#quiz-question'), {
            minFontSize: 4,
            maxFontSize: 200,
            multiLine: true,
            reProcess: true,
            alignHoriz: true,
            alignVert: true
        });

        // Show the answers
        const answerElements = document.querySelectorAll('.answer-text');
        
        // Reset the font size to a small value to allow textFit to calculate the correct size based on the content
        answerElements.forEach(e => e.style.fontSize = '1px');
        
        answers.forEach((answer, index) => {
            const el = document.querySelector(`#quiz-answer-${index}`);
            if (el) el.innerHTML = answer;
        });

        // Calculate the font size for the answers using textFit
        textFit(answerElements, {
            minFontSize: 4,
            maxFontSize: 200,
            multiLine: true,
            reProcess: true,
            alignHoriz: false,
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

        // Apply the smallest calculated font size to all answer texts
        fittedTexts.forEach(fittedElement => {
            fittedElement.style.fontSize = minCalculatedSize + 'px';
        });

        // Update the remaining questions
        document.querySelector('[data-lang-key=QUIZ_REMAINING_QUESTIONS]').textContent = LanguageData.get("QUIZ_REMAINING_QUESTIONS") + ` ${this.#currentQuestionIndex + 1}/${this.#questions.length}`;
    }

    /**
     * Start the answer countdown.
     *
     * This function does the following:
     * - Emit the countdown data to the projector
     * - Update the timer on the quiz screen
     * - Wait for the answer countdown to finish
     */
    static async #answerCountdown() {
        this.#remainingAnswerTime = this.#answerTime;

        // Emit the countdown data to the projector
        socket.emit('projector-update-countdown', {
            remainingTime: this.#remainingAnswerTime,
            answerTime: this.#answerTime,
            remainingTimeText: this.#instructions['remainingTime'][LanguageData.selectedLanguage]
        });

        // Update the timer on the quiz screen
        document.querySelector('[data-lang-key=QUIZ_SCREEN_TIMER]').innerHTML = LanguageData.get("QUIZ_SCREEN_TIMER").replace('%time%', this.#remainingAnswerTime);
        document.querySelector('#timer-progress-bar').setAttribute('value', this.#remainingAnswerTime * 100 / this.#answerTime);

        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                this.#remainingAnswerTime--;

                // Emit the updated countdown data to the projector
                socket.emit('projector-update-countdown', {
                    remainingTime: this.#remainingAnswerTime,
                    answerTime: this.#answerTime,
                    remainingTimeText: this.#instructions['remainingTime'][LanguageData.selectedLanguage]
                });

                document.querySelector('[data-lang-key=QUIZ_SCREEN_TIMER]').innerHTML = LanguageData.get("QUIZ_SCREEN_TIMER").replace('%time%', this.#remainingAnswerTime);
                document.querySelector('#timer-progress-bar').setAttribute('value', this.#remainingAnswerTime * 100 / this.#answerTime);
                if (this.#remainingAnswerTime <= 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        });
    }

    /**
     * Show the correct answer.
     *
     * This function does the following:
     * - Show the correct answer on the quiz screen
     * - Emit the correct answer to the projector
     */
    static #showCorrectAnswer() {
        const correctAnswer = this.#questions[this.#currentQuestionIndex].correctAnswer;

        // Add the correct/wrong answer classes to the answers
        document.querySelectorAll('.answer-container').forEach((e, index) => {
            if (index === correctAnswer) {
                e.classList.add('correct-answer-container');
            } else {
                e.classList.add('wrong-answer-container');
            }
        });
        document.querySelectorAll('.answer-label').forEach((e, index) => {
            if (index === correctAnswer) {
                e.classList.add('correct-answer-label');
            } else {
                e.classList.add('wrong-answer-label');
            }
        });

        // Emit the correct answer to the projector
        socket.emit('projector-display-answers', {
            answer: correctAnswer
        });
    }

    /**
     * Callback function to call when the language changes.
     *
     * It updates the question, answers, and the timer if the quiz is active.
     * It also updates the instructions if the instructions are showing.
     */
    static onLanguageChange() {
        if (this.#active) {
            this.#showQuestion();

            if (this.#remainingAnswerTime > 0) {
                document.querySelector('[data-lang-key=QUIZ_SCREEN_TIMER]').innerHTML = LanguageData.get("QUIZ_SCREEN_TIMER").replace('%time%', this.#remainingAnswerTime);
            }
        }
    }

    static getQuestionAmount() {
        return this.#maxQuestions;
    }

    static getAnswerTime() {
        return this.#answerTime;
    }
}

// Eventlistener die de melding laat zien dat er niet via het scherm geantwoord kan worden als er toch geklikt wordt
document.addEventListener('DOMContentLoaded', function() {
    
    const quizScreen = document.getElementById('quiz-screen');
    const overlay = document.querySelector('.no-answer-via-screen-overlay');
    let timeoutId; // Om de timer bij te houden

    quizScreen.addEventListener('click', function() { // Luister naar ELKE klik binnen het quiz-scherm      
        overlay.style.display = 'flex'; // Toon de overlay (maak er weer een flexbox van om te centreren)
        clearTimeout(timeoutId); // Reset een eventuele vorige timer, zodat de melding niet te vroeg verdwijnt 
        timeoutId = setTimeout(function() { // Verberg de overlay weer automatisch na 10 seconden
            overlay.style.display = 'none';
        }, 10000);
        
    });
});