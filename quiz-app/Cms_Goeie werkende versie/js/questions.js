/********************************************************************
 * questions.js
 * Logic for displaying, editing, and saving questions.
 ********************************************************************/

/**
 * Displays the main "Questions" page for editing questions.
 * Fetches all enabled questions and renders them with full edit controls.
 */
function displayQuestions() {
    // Update UI state
    updatePageUI("Vragen", "questionsButtonFrame");
    document.getElementById("buttonAddQuestion").style.display = "block";

    // Load questions from the database
    fetch('/cms/getQuestions')
        .then(response => response.json())
        .then(questions => {
            const questionsFrame = document.getElementById('questionsFrame');
            clearQuestionsFrame();

            questions.forEach(question => {
                let questionFrame = document.createElement('div');
                questionFrame.className = "questionFrame";
                questionFrame.id = question._id;
                questionFrame.innerHTML = `
                <div class="questionBorder"></div>
                
                <div class="content-wrapper">
                    <div class="questionLanguageBundle" contenteditable="false">
                        <div onclick="showAnswers(this.parentElement)" class="question" style="display: none;">${question.en.question}</div>
                        <div onclick="showAnswers(this.parentElement)" class="question" style="display: flex;">${question.nl.question}</div>
                        <div onclick="showAnswers(this.parentElement)" class="question" style="display: none;">${question.fr.question}</div>
                    </div>
                    <div class="answers" toggleEnable="true" correctAnswer="${question.correctAnswer}" style="display: none;" language="nl">
                        <div class="answerEN" style="display: none;">
                            <input type="radio" name="correctAnswerSelectEn_${question._id}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.en.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectEn_${question._id}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.en.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectEn_${question._id}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
                            <div class="answerC" contenteditable="false">${question.en.answers[2]}</div>
                        </div>
                        <div class="answerNL" style="display: block;">
                            <input type="radio" name="correctAnswerSelectNl_${question._id}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.nl.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectNl_${question._id}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.nl.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectNl_${question._id}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
                            <div class="answerC" contenteditable="false">${question.nl.answers[2]}</div>
                        </div>
                        <div class="answerFR" style="display: none;">
                            <input type="radio" name="correctAnswerSelectFr_${question._id}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.fr.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectFr_${question._id}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.fr.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectFr_${question._id}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
                            <div class="answerC" contenteditable="false">${question.fr.answers[2]}</div>
                        </div>
                    </div>
                </div>

                <div class="action-wrapper">
                    <div class="previousLanguage" onclick="previousLanguage(this.closest('.questionFrame'))">
                        <img class="editIcon" src="icons/arrowLeft.svg"/>
                    </div>
                    
                    <div class="language">nl</div>
                    
                    <div class="nextLanguage" onclick="nextLanguage(this.closest('.questionFrame'))">
                        <img class="editIcon" src="icons/arrowRight.svg"/>
                    </div>

                    <div class="editframe" onclick="enableEditing(this.closest('.questionFrame'))">
                        <img class="editIcon" src="icons/edit.svg" title="Bewerk"/>
                    </div>
                    
                    <div class="easyQuestion" 
                        style="background-color: ${question.easyQuestion ? '#DAF5DB' : '#F5DADA'};"
                        data-easy="${question.easyQuestion ? 'true' : 'false'}" 
                        onclick="easyQuestion('${question._id}')">
                        <img class="easyQuestionIcon" src="${question.easyQuestion ? 'icons/meterMakkelijk.svg' : 'icons/meterMoeilijk.svg'}" title="Definieer moeilijkheid"/>
                    </div>
                    
                    <div class="deleteQuestion" onclick="deleteQuestion('${question._id}')">
                        <img class="deleteQuestionIcon" src="icons/recyclebin.svg" title="vraag verwijderen"/>
                    </div>

                    <label class="enableSwitch">
                        <input type="checkbox" onchange="toggleQuestionStatus('${question._id}', this.checked)" ${question.enabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                </div>
                `;
                questionsFrame.appendChild(questionFrame);
            });
        })
        .catch(error => console.error(`Error getting questions: ${error}`));
}

/**
 * Adds a new, empty question frame to the "Questions" page.
 * @param {HTMLElement} questionsFrame - The main container to append the new question to.
 */
function buttonAddQuestion(questionsFrame) {
    let questionFrame = document.createElement('div');
    questionFrame.className = 'questionFrame';
    // Let op: geen ID instellen! Zo weet de backend dat dit een nieuwe vraag is.

    questionFrame.innerHTML = `
    <div class="questionBorder"></div>
    
    <div class="content-wrapper">
        <div class="questionLanguageBundle" contenteditable="false">
            <div onclick="showAnswers(this.parentElement)" class="question" style="display: none;"></div>
            <div onclick="showAnswers(this.parentElement)" class="question" style="display: flex;"></div>
            <div onclick="showAnswers(this.parentElement)" class="question" style="display: none;"></div>
        </div>
        <div class="answers" toggleEnable="true" style="display: none;" language="nl">
            <div class="answerEN" style="display: none;">
                <input type="radio" name="correctAnswerSelectEn_new" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectEn_new" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectEn_new" id="correctAwnserC" disabled>
                <div class="answerC" contenteditable="false">&nbsp;</div>
            </div>
            <div class="answerNL" style="display: block;">
                <input type="radio" name="correctAnswerSelectNl_new" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectNl_new" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectNl_new" id="correctAwnserC" disabled>
                <div class="answerC" contenteditable="false">&nbsp;</div>
            </div>
            <div class="answerFR" style="display: none;">
                <input type="radio" name="correctAnswerSelectFr_new" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectFr_new" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectFr_new" id="correctAwnserC" disabled>
                <div class="answerC" contenteditable="false">&nbsp;</div>
            </div>
        </div>
    </div>

    <div class="action-wrapper">
        <div class="previousLanguage" onclick="previousLanguage(this.closest('.questionFrame'))">
            <img class="editIcon" src="icons/arrowLeft.svg"/>
        </div>
        
        <div class="language">nl</div>
        
        <div class="nextLanguage" onclick="nextLanguage(this.closest('.questionFrame'))">
            <img class="editIcon" src="icons/arrowRight.svg"/>
        </div>

        <div class="editframe" onclick="enableEditing(this.closest('.questionFrame'))">
            <img class="editIcon" src="icons/edit.svg" title="Bewerk"/>
        </div>
        
        <div class="easyQuestion" 
            style="background-color: #F5DADA;"
            data-easy="false" 
            onclick="easyQuestion(this)">
            <img class="easyQuestionIcon" src="icons/meterMoeilijk.svg" title="Definieer moeilijkheid"/>
        </div>
        
        <div class="deleteQuestion" style="display: none;" onclick="deleteQuestion(this.closest('.questionFrame').id)">
            <img class="deleteQuestionIcon" src="icons/recyclebin.svg" title="vraag verwijderen"/>
        </div>

        <label class="enableSwitch" style="display: none;">
            <input type="checkbox" onchange="toggleQuestionStatus(this.closest('.questionFrame').id, this.checked)" checked>
            <span class="slider round"></span>
        </label>
    </div>
    `;
    questionsFrame.insertBefore(questionFrame, questionsFrame.firstChild); // Optioneel: zet nieuwe vraag bovenaan
    
    // Automatisch openen om te bewerken
    enableEditing(questionFrame);
}

/**
 * Toggles the visibility of the answer block for a question.
 * @param {HTMLElement} element - The question element that was clicked.
 */
function showAnswers(element) {
    // Only toggle if not in edit mode
    if (element.getAttribute("contenteditable") === "false") {
        let answerBlock = element.nextElementSibling;

        // Toggle visibility for the current question
        const isHidden = answerBlock.style.display === 'none';
        answerBlock.style.display = isHidden ? 'block' : 'none';

        // Hide all other answer blocks that are not being edited
        let allAnswers = document.querySelectorAll('.answers');
        allAnswers.forEach(function(otherAnswerBlock) {
            if (otherAnswerBlock !== answerBlock && otherAnswerBlock.getAttribute("toggleEnable") === "true") {
                otherAnswerBlock.style.display = 'none';
            }
        });
    } else {
        console.log("Cannot toggle answers while in edit mode.");
    }
}

/**
 * Enables the content-editable fields for a specific question.
 * @param {HTMLElement} questionFrame - The .questionFrame element to make editable.
 */
function enableEditing(questionFrame) {
    questionFrame.querySelector('.previousLanguage').style.display = "none";
    questionFrame.querySelector('.nextLanguage').style.display = "none";

    let questionBundle = questionFrame.querySelector('.questionLanguageBundle');
    let questions = questionBundle.querySelectorAll('.question');
    let answersBundle = questionFrame.querySelector(".answers");
    let language = answersBundle.getAttribute("language");
    let answers = questionFrame.querySelector((language === "en") ? ".answerEN" : ((language === "nl") ? ".answerNL" : ".answerFR"));
    let languageIndex = (language === "en") ? 0 : (language === "nl") ? 1 : 2;

    let editFrame = questionFrame.querySelector('.editframe');
    editFrame.innerHTML = '<img class="editIcon" src="icons/save.svg">';
    editFrame.onclick = function() {
        saveChanges(questionFrame);
    };

    questions[languageIndex].onclick = null;
    answersBundle.setAttribute("toggleEnable", false);
    if (answersBundle.style.display === 'none') {
        answersBundle.style.display = 'block'; 
    }

    answers.children[0].removeAttribute("disabled");
    answers.children[2].removeAttribute("disabled");
    answers.children[4].removeAttribute("disabled");

    questionBundle.contentEditable = 'false'; 
    questions[languageIndex].contentEditable = 'true';
    
    answers.children[1].contentEditable = 'true';
    answers.children[3].contentEditable = 'true';
    answers.children[5].contentEditable = 'true';

    questions[languageIndex].focus();
}

/**
 * Saves the changes from an edited question to the database.
 * @param {HTMLElement} questionFrame - The .questionFrame being saved.
 */
/**
 * Saves the changes from an edited question to the database.
 */
function saveChanges(questionFrame) {
    let questionBundle = questionFrame.querySelector('.questionLanguageBundle');
    // ROBUUST: Pak de specifieke vraag-divs
    let questions = questionBundle.querySelectorAll('.question');
    let answersBundle = questionFrame.querySelector(".answers");
    let language = answersBundle.getAttribute("language");
    let answers = questionFrame.querySelector((language === "en") ? ".answerEN" : ((language === "nl") ? ".answerNL" : ".answerFR"));
    let languageIndex = (language === "en") ? 0 : (language === "nl") ? 1 : 2;

    let correctAnswer = (answers.children[0].checked) ? 0 : (answers.children[2].checked) ? 1 : 2;

    if (answers.children[1].textContent.trim() === "" ||
        answers.children[3].textContent.trim() === "" ||
        answers.children[5].textContent.trim() === "") {
        alert("Al de antwoorden dienen ingevuld te worden.");
        return;
    }

    if (questions[languageIndex].textContent.trim() === "") {
        alert("De vraag dient ingevuld te worden.");
        return;
    }

    if (!answers.children[0].checked && !answers.children[2].checked && !answers.children[4].checked) {
        alert("Er dient een juist antwoord gekozen te worden met behulp van de radiobuttons.");
        return;
    }

    for (let i = 0; i < 3; i++) {
        answersBundle.children[i].children[2 * correctAnswer].checked = true;
    }

    answers.children[0].setAttribute("disabled", "disabled");
    answers.children[2].setAttribute("disabled", "disabled");
    answers.children[4].setAttribute("disabled", "disabled");

    questionFrame.querySelector('.previousLanguage').style.display = "flex";
    questionFrame.querySelector('.nextLanguage').style.display = "flex";

    // Zet alles netjes weer op slot
    questions[languageIndex].contentEditable = 'false';
    answers.children[1].contentEditable = 'false';
    answers.children[3].contentEditable = 'false';
    answers.children[5].contentEditable = 'false';

    let editFrame = questionFrame.querySelector('.editframe');
    editFrame.innerHTML = '<img class="editIcon" src="icons/edit.svg">';
    editFrame.onclick = function() {
        enableEditing(questionFrame);
    };

    // Robuuste koppeling voor het openklappen van de antwoorden
    questions[languageIndex].onclick = function() {
        showAnswers(questionBundle);
    };

    answersBundle.style.display = 'none';

    // --- Send data to server ---
    fetch("/cms/editQuestion", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // GEFIXED: Haal de ID rechtstreeks uit het questionFrame
                questionId: questionFrame.getAttribute("id"),
                language: language,
                newQuestion: questions[languageIndex].textContent.trim(), 
                newAnswer1: answersBundle.children[languageIndex].children[1].textContent.trim(),
                newAnswer2: answersBundle.children[languageIndex].children[3].textContent.trim(),
                newAnswer3: answersBundle.children[languageIndex].children[5].textContent.trim(),
                correctAnswer: correctAnswer,
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error('Failed to save question');
                throw new Error('Failed to save question');
            }
        })
        .then(data => {
            if (data.newId) {
                // This was a new question; server returned the new _id
                console.log('New question created with Id:', data.newId);
                
                // Stel ID in
                questionFrame.setAttribute("id", data.newId);

                // NIEUW: Maak vuilbakje en enable-switch weer zichtbaar
                questionFrame.querySelector('.deleteQuestion').style.display = '';
                questionFrame.querySelector('.enableSwitch').style.display = '';

                const newQuestionText = questions[languageIndex].textContent.trim();
                // ... (de rest van je bestaande code hier blijft hetzelfde)
                
                // Check of de gebruiker de vraag intussen makkelijk heeft gemaakt...
                const isEasy = questionFrame.querySelector('.easyQuestion').getAttribute('data-easy') === 'true';
                if (isEasy) {
                    fetch("/cms/saveEasyCheckBoxes", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionDict: { [data.newId]: { easySwitch: true } } })
                    });
                }
            }
        })
    }

/**
 * Synchronizes the selected correct answer across all language tabs.
 * @param {HTMLElement} currentLanguageDiv - The specific language div containing the clicked radio button.
 * @param {string} choice - The selected answer ('A', 'B', or 'C').
 */
function selectCorrectAnswer(currentLanguageDiv, choice) {
    // Determine the index of the radio button based on the choice (0 for A, 2 for B, 4 for C)
    let radioIndex = (choice === 'A') ? 0 : (choice === 'B') ? 2 : 4;
    
    // The parent of the current language div is the main "answers" bundle
    let answersBundle = currentLanguageDiv.parentElement;
    
    // Loop through all 3 languages (en, nl, fr) and sync the radio buttons
    for (let i = 0; i < 3; i++) {
        answersBundle.children[i].children[radioIndex].checked = true;
    }
}

/**
 * Sets the visible language for a given question frame.
 * Hides all language-specific elements and shows only the one for the new language.
 * @param {HTMLElement} questionFrame - The .questionFrame element.
 * @param {string} newLanguage - The language to switch to ("en", "nl", or "fr").
 */
function setLanguage(questionFrame, newLanguage) {
    const languageMap = { 'en': 0, 'nl': 1, 'fr': 2 };
    const newIndex = languageMap[newLanguage];

    const answersBundle = questionFrame.querySelector(".answers");
    const questionBundle = questionFrame.querySelector(".questionLanguageBundle");
    // ROBUUST: Zoek specifiek naar de vraag-divs, negeer browser-rommel
    const questions = questionBundle.querySelectorAll(".question"); 
    const languageFrame = questionFrame.querySelector(".language");

    answersBundle.setAttribute("language", newLanguage);
    languageFrame.textContent = newLanguage;

    for (let i = 0; i < 3; i++) {
        answersBundle.children[i].style.display = (i === newIndex) ? "block" : "none";
        
        // Check of de vraag bestaat en verander de display
        if (questions[i]) {
            questions[i].style.display = (i === newIndex) ? "flex" : "none";
        }
    }
}

/**
 * Switches the question to display the next language (en -> nl -> fr -> en).
 * @param {HTMLElement} questionFrame - The .questionFrame element.
 */
function nextLanguage(questionFrame) {
    const answers = questionFrame.querySelector(".answers");
    const currentLanguage = answers.getAttribute("language");
    const nextLang = (currentLanguage === "en") ? "nl" : ((currentLanguage === "nl") ? "fr" : "en");
    setLanguage(questionFrame, nextLang);
}

/**
 * Switches the question to display the previous language (en -> fr -> nl -> en).
 * @param {HTMLElement} questionFrame - The .questionFrame element.
 */
function previousLanguage(questionFrame) {
    const answers = questionFrame.querySelector(".answers");
    const currentLanguage = answers.getAttribute("language");
    const prevLang = (currentLanguage === "en") ? "fr" : ((currentLanguage === "nl") ? "en" : "nl");
    setLanguage(questionFrame, prevLang);
}

/**
 * Verwijder een vraag uit de database en de UI.
 * @param {string} questionId - Het unieke ID van de vraag.
 */
function deleteQuestion(questionId) {
    if (!confirm("Weet je zeker dat je deze vraag wilt verwijderen?")) {
        return;
    }

    fetch("/cms/delQuestion", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Zorg dat de key 'questionId' heet, want zo leest je backend het (req.body.questionId)
        body: JSON.stringify({ questionId: questionId }) 
    })
    .then(response => {
        if (response.ok) {
            // Verwijder het element uit de DOM na succes
            const element = document.getElementById(questionId);
            if (element) {
                element.remove();
                console.log(`Vraag ${questionId} succesvol verwijderd.`);
            }
        } else {
            alert("Er is een fout opgetreden bij het verwijderen van de vraag.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Er kon geen verbinding worden gemaakt met de server.");
    });
}

/**
 * Toggles de moeilijkheidsgraad (easyQuestion).
 * Accepteert zowel het HTML-element (nieuwe vragen) als een questionId (bestaande vragen).
 * @param {HTMLElement|string} param - De div van de knop zelf, of het ID van de vraag.
 */
function easyQuestion(param) {
    let buttonElement;

    // 1. Controleer of param een ID (tekst) is, of het HTML element
    if (typeof param === 'string') {
        const frame = document.getElementById(param);
        if (!frame) return; // Veiligheidscheck
        buttonElement = frame.querySelector('.easyQuestion');
    } else {
        buttonElement = param;
    }

    if (!buttonElement) return; // Extra veiligheidscheck

    // 2. Nu weten we 100% zeker dat buttonElement het HTML element is
    const questionFrame = buttonElement.closest('.questionFrame');
    const questionId = questionFrame.getAttribute("id");
    const easyIcon = buttonElement.querySelector('.easyQuestionIcon');

    // 3. Lees status en draai om
    const currentStatus = buttonElement.getAttribute('data-easy') === 'true';
    const newStatus = !currentStatus;

    // 4. Direct de UI aanpassen
    buttonElement.setAttribute('data-easy', newStatus);
    if (newStatus) {
        easyIcon.src = 'icons/meterMakkelijk.svg';
        buttonElement.style.backgroundColor = '#DAF5DB';
    } else {
        easyIcon.src = 'icons/meterMoeilijk.svg';
        buttonElement.style.backgroundColor = '#F5DADA';
    }

    // 5. Als er nog geen ID is (nieuwe onopgeslagen vraag), stop hier.
    if (!questionId || questionId.trim() === "") {
        return; 
    }

    // 6. Als de vraag WEL al een ID heeft, update de database.
    fetch("/cms/saveEasyCheckBoxes", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            questionDict: { [questionId]: { easySwitch: newStatus } }
        })
    }).catch(error => {
        console.error('Error:', error);
        alert("Kon de moeilijkheid niet op de server opslaan.");
    });
}