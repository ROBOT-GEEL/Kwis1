/********************************************************************
 * visited.js
 * Logic for the "Visited" page (marking questions as visited).
 ********************************************************************/

/**
 * Displays the "Visited" page.
 * Fetches all *enabled* questions and renders them with a visited/not-visited toggle.
 * Sorts to show visited questions first.
 */
function buttonVisited() {
    // Update UI using the new responsive layout functions
    updatePageUI("Bezocht", "visitedFrame");
    hideAllActionButtons();
    
    // Bind the unified buttons to the specific Visited actions
    configureActionButtons(
        () => buttonVisitedSave(),
        () => buttonVisited() // Cancel simply reloads the current view from the database
    );

    fetch('/cms/getQuestions')
        .then(response => response.json())
        .then(questions => {
            const questionsFrame = document.getElementById('questionsFrame');
            clearQuestionsFrame();

            // Filter out disabled questions first
            let enabledQuestions = questions.filter(question => question.enabled);

            // Separate visited and not-visited questions
            let visitedQuestions = enabledQuestions.filter(question => question.bezocht);
            let notVisitedQuestions = enabledQuestions.filter(question => !question.bezocht);
            let sortedQuestions = visitedQuestions.concat(notVisitedQuestions);

            sortedQuestions.forEach(question => {
                let questionFrame = document.createElement('div');
                questionFrame.className = "questionFrame";
                questionFrame.id = question._id;
                
                // Construct the HTML for each question, including the toggle switch
                questionFrame.innerHTML = `
                <div class="questionBorder"></div>
                <div onclick="showAnswers(this.parentElement)" class="question" contenteditable="false">${question.nl.question}</div>
                <label class="enableSwitch">
                    <input type="checkbox" ${question.bezocht ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
                <div class="answers" toggleEnable="true" style="display: none;">
                    <div class="answerA" contenteditable="false">${question.en.answers[0]}</div>
                    <div class="answerB" contenteditable="false">${question.en.answers[1]}</div>
                    <div class="answerC" contenteditable="false">${question.en.answers[2]}</div>
                </div>
            `;
                questionsFrame.appendChild(questionFrame);
            });

            // Add listeners to the new checkboxes to trigger the "Save" button state
            initializeCheckboxChangeListeners();
        })
        .catch(error => console.error(`Error getting questions: ${error}`));
}

/**
 * Saves the current "visited" status of all questions.
 * This calls the generic saveCheckboxState function from common.js
 */
function buttonVisitedSave() {
    // Send the updated states to the local server
    saveCheckboxState('/cms/saveVisitedCheckBoxes', 'btnSave', 'visitedSwitch');
}