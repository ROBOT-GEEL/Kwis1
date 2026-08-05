/********************************************************************
 * questions.js
 * Logic for displaying, editing, and saving questions.
 ********************************************************************/

/**
 * Displays the main "Questions" page for editing questions.
 * Fetches all enabled questions and renders them with full edit controls.
 */
function displayQuestions() {
    updatePageUI("Vragen", "questionsButtonFrame");
    document.getElementById("buttonAddQuestion").style.display = "block";

    fetch('/cms/getQuestions')
        .then(response => response.json())
        .then(questions => {
            const questionsFrame = document.getElementById('questionsFrame');
            clearQuestionsFrame();

            questions.forEach(question => {
                let questionFrame = document.createElement('div');
                questionFrame.className = "questionFrame";
                
                // FIX: Haal consequent het juiste _id uit de database
                const qId = question._id; 
                questionFrame.id = qId;
                
                questionFrame.innerHTML = `
                <div class="questionBorder"></div>
                
                <div class="content-wrapper">
                    <div class="questionLanguageBundle" contenteditable="false">
                        <div onclick="showAnswers(this.parentElement)" onmouseenter="showAnswers(this.parentElement, true)" class="question" style="display: none;">${question.en.question}</div>
                        <div onclick="showAnswers(this.parentElement)" onmouseenter="showAnswers(this.parentElement, true)" class="question" style="display: flex;">${question.nl.question}</div>
                        <div onclick="showAnswers(this.parentElement)" onmouseenter="showAnswers(this.parentElement, true)" class="question" style="display: none;">${question.fr.question}</div>
                    </div>
                    <div class="answers" toggleEnable="true" correctAnswer="${question.correctAnswer}" style="display: none;" language="nl">
                        <div class="answerEN" style="display: none;">
                            <input type="radio" name="correctAnswerSelectEn_${qId}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.en.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectEn_${qId}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.en.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectEn_${qId}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
                            <div class="answerC" contenteditable="false">${question.en.answers[2]}</div>
                        </div>
                        <div class="answerNL" style="display: block;">
                            <input type="radio" name="correctAnswerSelectNl_${qId}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.nl.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectNl_${qId}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.nl.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectNl_${qId}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
                            <div class="answerC" contenteditable="false">${question.nl.answers[2]}</div>
                        </div>
                        <div class="answerFR" style="display: none;">
                            <input type="radio" name="correctAnswerSelectFr_${qId}" id="correctAwnserA" onclick="selectCorrectAnswer(this.parentElement,'A')" ${(question.correctAnswer === 0)? "checked" : ""} disabled>
                            <div class="answerA" contenteditable="false">${question.fr.answers[0]}</div>
                            <input type="radio" name="correctAnswerSelectFr_${qId}" id="correctAwnserB" onclick="selectCorrectAnswer(this.parentElement,'B')" ${(question.correctAnswer === 1)? "checked" : ""} disabled>
                            <div class="answerB" contenteditable="false">${question.fr.answers[1]}</div>
                            <input type="radio" name="correctAnswerSelectFr_${qId}" id="correctAwnserC" onclick="selectCorrectAnswer(this.parentElement,'C')" ${(question.correctAnswer === 2)? "checked" : ""} disabled>
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
                    
                    <!-- FIX: Knoppen maken nu dynamisch gebruik van de elementen zelf i.p.v. hardgecodeerde string variabelen -->
                    <div class="easyQuestion" 
                        style="background-color: ${question.easyQuestion ? '#DAF5DB' : '#F5DADA'};"
                        data-easy="${question.easyQuestion ? 'true' : 'false'}" 
                        onclick="easyQuestion(this)">
                        <img class="easyQuestionIcon" src="${question.easyQuestion ? 'icons/meterMakkelijk.svg' : 'icons/meterMoeilijk.svg'}" title="Definieer moeilijkheid"/>
                    </div>
                    
                    <div class="deleteQuestion" onclick="deleteQuestion(this.closest('.questionFrame').id)">
                        <img class="deleteQuestionIcon" src="icons/recyclebin.svg" title="vraag verwijderen"/>
                    </div>

                    <label class="enableSwitch">
                        <input type="checkbox" onchange="toggleQuestionStatus(this.closest('.questionFrame').id, this.checked)" ${question.enabled ? 'checked' : ''}>
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

    // FIX: Genereer een tijdelijk uniek ID zodat radiobuttons van 
    // meerdere onopgeslagen vragen elkaar niet uitschakelen.
    const tempId = "new_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

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
                <input type="radio" name="correctAnswerSelectEn_${tempId}" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectEn_${tempId}" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectEn_${tempId}" id="correctAwnserC" disabled>
                <div class="answerC" contenteditable="false">&nbsp;</div>
            </div>
            <div class="answerNL" style="display: block;">
                <input type="radio" name="correctAnswerSelectNl_${tempId}" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectNl_${tempId}" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectNl_${tempId}" id="correctAwnserC" disabled>
                <div class="answerC" contenteditable="false">&nbsp;</div>
            </div>
            <div class="answerFR" style="display: none;">
                <input type="radio" name="correctAnswerSelectFr_${tempId}" id="correctAwnserA" disabled>
                <div class="answerA" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectFr_${tempId}" id="correctAwnserB" disabled>
                <div class="answerB" contenteditable="false">&nbsp;</div>
                <input type="radio" name="correctAnswerSelectFr_${tempId}" id="correctAwnserC" disabled>
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
    questionsFrame.insertBefore(questionFrame, questionsFrame.firstChild); 
    
    // Automatisch openen om te bewerken
    enableEditing(questionFrame);
}

/**
 * Toggles the visibility of the answer block for a question.
 * @param {HTMLElement} element - The question element that was clicked.
 * @param {boolean} forceOpen - If true, it will only open the answers (prevents flickering on hover).
 */
function showAnswers(element, forceOpen = false) {
    // Only toggle if not in edit mode
    if (element.getAttribute("contenteditable") === "false") {
        let answerBlock = element.nextElementSibling;

        // Als we hoveren en hij staat al open, doe dan niets om flikkeren te voorkomen.
        if (forceOpen && answerBlock.style.display === 'block') {
            return;
        }

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
 * Enables the content-editable fields for ALL languages simultaneously.
 * @param {HTMLElement} questionFrame - The .questionFrame element to make editable.
 */
/**
 * Enables the content-editable fields for ALL languages simultaneously.
 * @param {HTMLElement} questionFrame - The .questionFrame element to make editable.
 */
function enableEditing(questionFrame) {
    let questionBundle = questionFrame.querySelector('.questionLanguageBundle');
    let questions = questionBundle.querySelectorAll('.question');
    let answersBundle = questionFrame.querySelector(".answers");

    // Zet de opslaan-knop klaar
    let editFrame = questionFrame.querySelector('.editframe');
    editFrame.innerHTML = '<img class="editIcon" src="icons/save.svg" title="Opslaan">';
    editFrame.onclick = function() {
        saveChanges(questionFrame);
    };

    answersBundle.setAttribute("toggleEnable", false);
    if (answersBundle.style.display === 'none') {
        answersBundle.style.display = 'block'; 
    }

    const languages = ["en", "nl", "fr"];
    
    // 2. Loop door ALLE talen en maak ze allemaal bewerkbaar
    for (let i = 0; i < 3; i++) {
        questions[i].onclick = null;
        questions[i].onmouseenter = null;
        questions[i].contentEditable = 'true';

        let ansDiv = questionFrame.querySelector(
            languages[i] === "en" ? ".answerEN" : (languages[i] === "nl" ? ".answerNL" : ".answerFR")
        );
        
        // Tekstvelden bewerkbaar maken
        ansDiv.children[1].contentEditable = 'true';
        ansDiv.children[3].contentEditable = 'true';
        ansDiv.children[5].contentEditable = 'true';

        // --- NIEUW: Radiobuttons activeren én direct synchroniseren ---
        // De indices 0, 2 en 4 zijn de posities van de radiobuttons in de ansDiv
        [0, 2, 4].forEach(radioIndex => {
            ansDiv.children[radioIndex].removeAttribute("disabled");
            
            // Als deze specifieke radiobutton wordt aangeklikt:
            ansDiv.children[radioIndex].onchange = function() {
                // Zet het vinkje op dezelfde positie aan voor álle 3 de talen
                questionFrame.querySelector(".answerEN").children[radioIndex].checked = true;
                questionFrame.querySelector(".answerNL").children[radioIndex].checked = true;
                questionFrame.querySelector(".answerFR").children[radioIndex].checked = true;
            };
        });
    }

    let currentLang = answersBundle.getAttribute("language");
    let languageIndex = (currentLang === "en") ? 0 : (currentLang === "nl") ? 1 : 2;
    questions[languageIndex].focus();
}

/**
 * Validates all languages and saves the changes to the database.
 */
function saveChanges(questionFrame) {
    let questionBundle = questionFrame.querySelector('.questionLanguageBundle');
    let questions = questionBundle.querySelectorAll('.question');
    let answersBundle = questionFrame.querySelector(".answers");

    const languages = ["en", "nl", "fr"];
    let globalCorrectAnswer = null;
    let dataToSave = {}; // Hier bouwen we onze JSON payload op

    // 1. Validatie & Data verzamelen over ALLE talen heen
    for (let i = 0; i < 3; i++) {
        let lang = languages[i];
        let ansDiv = questionFrame.querySelector(
            lang === "en" ? ".answerEN" : (lang === "nl" ? ".answerNL" : ".answerFR")
        );

        let qText = questions[i].textContent.trim();
        let a1Text = ansDiv.children[1].textContent.trim();
        let a2Text = ansDiv.children[3].textContent.trim();
        let a3Text = ansDiv.children[5].textContent.trim();

        // Check op lege velden
        if (qText === "" || a1Text === "" || a2Text === "" || a3Text === "") {
            setLanguage(questionFrame, lang); // Spring direct naar de ontbrekende taal!
            alert(`Vul alstublieft de vraag en alle 3 antwoorden in voor de taal: ${lang.toUpperCase()}`);
            return; // Stop de save functie
        }

        // Bepaal correct antwoord (hoeft maar 1x omdat ze synchroon lopen dankzij selectCorrectAnswer)
        if (i === 0) {
            if (!ansDiv.children[0].checked && !ansDiv.children[2].checked && !ansDiv.children[4].checked) {
                setLanguage(questionFrame, lang);
                alert("Kies het juiste antwoord met de radiobuttons.");
                return;
            }
            globalCorrectAnswer = (ansDiv.children[0].checked) ? 0 : (ansDiv.children[2].checked) ? 1 : 2;
        }

        // Sla de teksten op in ons object
        dataToSave[lang] = {
            question: qText,
            answers: [a1Text, a2Text, a3Text]
        };
    }

    // 2. Als we hier zijn geraakt, is alles gevalideerd! Tijd om de UI weer op slot te doen.
    for (let i = 0; i < 3; i++) {
        let lang = languages[i];
        let ansDiv = questionFrame.querySelector(
            lang === "en" ? ".answerEN" : (lang === "nl" ? ".answerNL" : ".answerFR")
        );

        questions[i].contentEditable = 'false';
        questions[i].onclick = function() { showAnswers(questionBundle); };
        questions[i].onmouseenter = function() { showAnswers(questionBundle, true); };

        ansDiv.children[0].setAttribute("disabled", "disabled");
        ansDiv.children[2].setAttribute("disabled", "disabled");
        ansDiv.children[4].setAttribute("disabled", "disabled");

        ansDiv.children[1].contentEditable = 'false';
        ansDiv.children[3].contentEditable = 'false';
        ansDiv.children[5].contentEditable = 'false';
    }

    let editFrame = questionFrame.querySelector('.editframe');
    editFrame.innerHTML = '<img class="editIcon" src="icons/edit.svg" title="Bewerk">';
    editFrame.onclick = function() {
        enableEditing(questionFrame);
    };

    answersBundle.style.display = 'none';

    // 3. Stuur ALLES in één keer naar de backend
    fetch("/cms/editQuestion", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            questionId: questionFrame.getAttribute("id"),
            correctAnswer: globalCorrectAnswer,
            translations: dataToSave // Bevat .en, .nl, .fr
        })
    })
    .then(response => {
        if (response.ok) return response.json();
        throw new Error('Failed to save question');
    })
    .then(data => {
        if (data.newId) {
            console.log('New question created with Id:', data.newId);
            questionFrame.setAttribute("id", data.newId);
            questionFrame.querySelector('.deleteQuestion').style.display = '';
            questionFrame.querySelector('.enableSwitch').style.display = '';

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
    .catch(error => {
        console.error(`Error saving questions: ${error}`);
        alert("Er ging iets mis bij het opslaan op de server.");
    });
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

/**
 * Toggles de in-/uitgeschakeld status van een vraag.
 * Past zich aan de saveEnabledCheckBoxes structuur van de backend aan.
 * @param {string} questionId - Het unieke ID van de vraag.
 * @param {boolean} isEnabled - De nieuwe status (true = aan, false = uit).
 */
function toggleQuestionStatus(questionId, isEnabled) {
    if (!questionId || questionId === "new" || questionId.trim() === "") {
        return;
    }

    const payload = {
        questionDict: {
            [questionId]: { enableSwitch: isEnabled }
        }
    };

    fetch("/cms/saveEnabledCheckBoxes", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fout bij het opslaan in de database.');
        }
        console.log(`Status van vraag ${questionId} succesvol aangepast naar ${isEnabled}.`);
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Kon de status niet opslaan. De instelling springt terug.");
        
        const questionFrame = document.getElementById(questionId);
        if (questionFrame) {
            const checkbox = questionFrame.querySelector('.enableSwitch input');
            if (checkbox) {
                checkbox.checked = !isEnabled; // Draai de visuele verandering terug
            }
        }
    });
}

/**
 * Filtert de weergegeven vragen op basis van de tekst in de zoekbalk.
 * Doorzoekt de tekst van zowel de vragen als de antwoorden over alle talen heen.
 */

function filterQuestions() {
    // 1. Lees de huidige waarden van alle filters uit
    let input = document.getElementById('questionSearchBar').value.toLowerCase();
    let statusFilter = document.getElementById('filterStatus').value;
    let difficultyFilter = document.getElementById('filterDifficulty').value;
    
    let questionFrames = document.querySelectorAll('.questionFrame');

    questionFrames.forEach(function(frame) {
        // -- Check 1: Voldoet de tekst? --
        let contentWrapper = frame.querySelector('.content-wrapper');
        let textToSearch = contentWrapper ? contentWrapper.textContent.toLowerCase() : "";
        let matchesText = textToSearch.includes(input);

        // -- Check 2: Voldoet de status (Enabled/Disabled)? --
        let isEnabled = frame.querySelector('.enableSwitch input').checked;
        let matchesStatus = (statusFilter === "all") || 
                            (statusFilter === "enabled" && isEnabled) || 
                            (statusFilter === "disabled" && !isEnabled);

        // -- Check 3: Voldoet de moeilijkheidsgraad (Easy/Hard)? --
        let isEasy = frame.querySelector('.easyQuestion').getAttribute('data-easy') === 'true';
        let matchesDifficulty = (difficultyFilter === "all") || 
                                (difficultyFilter === "easy" && isEasy) || 
                                (difficultyFilter === "hard" && !isEasy);

        // Als de vraag aan ALLE actieve filters voldoet, laten we hem zien
        if (matchesText && matchesStatus && matchesDifficulty) {
            frame.style.display = ""; 
        } else {
            frame.style.display = "none"; 
        }
    });
}