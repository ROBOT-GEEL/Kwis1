/********************************************************************
 * common.js
 * Common helper functions
 ********************************************************************/

// Object holding the explanations for each page
const pageExplanations = {
    "Vragen": "Beheer de inhoud van alle quizvragen en hun vertalingen. Zorg ervoor dat je alle wijzigingen opslaat.",
    "Actief": "Kies welke vragen worden gebruikt tijdens de quiz.",
    "Bezocht": "Kies welke vragen worden getoond aan mensen dat de expo hebben bezocht."
};

/**
 * Updates the page title, active navigation button, and explanation text.
 * @param {string} title - The new text for the main title.
 * @param {string} activeNavId - The ID of the nav button to highlight.
 */
function updatePageUI(title, activeNavId) {
    // Set the main title and explanation text
    document.getElementById("title").innerHTML = title;
    document.getElementById("pageExplanation").innerHTML = pageExplanations[title] || "";

    // Reset styles for all nav buttons
    const navFrames = ["questionsButtonFrame", "enabledFrame", "visitedFrame"];
    navFrames.forEach(frameId => {
        const el = document.getElementById(frameId);
        if (el) {
            el.classList.remove("active");
            el.style.background = "#80c8cc"; 
        }
    });

    // Set active style for current nav
    const activeNav = document.getElementById(activeNavId);
    if (activeNav) {
        activeNav.classList.add("active");
        activeNav.style.background = "#6dbbc0"; 
    }
}

/**
 * Hides standard action buttons.
 */
function hideAllActionButtons() {
    document.getElementById("btnSave").style.display = "none";
    document.getElementById("btnCancel").style.display = "none";
    document.getElementById("buttonAddQuestion").style.display = "none";
}

/**
 * Sets up the Save and Cancel buttons dynamically based on the current context.
 * @param {Function} saveCallback - Function to execute on save.
 * @param {Function} cancelCallback - Function to execute on cancel.
 */
function configureActionButtons(saveCallback, cancelCallback) {
    const btnSave = document.getElementById("btnSave");
    const btnCancel = document.getElementById("btnCancel");

    btnSave.style.display = "block";
    btnSave.textContent = "Opgeslagen"; // Default state until changed
    btnSave.onclick = saveCallback;

    btnCancel.style.display = "block";
    btnCancel.onclick = cancelCallback;
}

/**
 * Clears the main content frame where questions are displayed.
 */
function clearQuestionsFrame() {
    document.getElementById('questionsFrame').innerHTML = '';
}

/**
 * Generic function to save the state of all checkboxes on a page (Enable/Visited).
 * @param {string} endpoint - The API endpoint to send the data to.
 * @param {string} buttonId - The ID of the save button (e.g., "buttonEnableSave").
 * @param {string} propertyName - The key to use in the JSON object (e.g., "enableSwitch").
 */
async function saveCheckboxState(endpoint, buttonId, propertyName) {
    const saveButton = document.getElementById(buttonId);
    saveButton.textContent = "Opslaan...";

    const switches = document.querySelectorAll('.enableSwitch'); // Class is always .enableSwitch
    const questionDict = {};

    // Collect the state of each checkbox
    switches.forEach(enableSwitch => {
        const questionId = enableSwitch.parentElement.id;
        questionDict[questionId] = {
            [propertyName]: enableSwitch.firstElementChild.checked,
        };
    });

    // Send the dictionary to the server
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questionDict
            })
        });

        if (response.ok) {
            console.log(`Flags saved successfully to ${endpoint}`);
            saveButton.textContent = "Opgeslagen";
            return response.text();
        } else {
            console.error(`Failed to save flags to ${endpoint}`);
            throw new Error(`Failed to save flags to ${endpoint}`);
        }
    } catch (error) {
        console.error('Error saving checkbox state:', error);
        saveButton.textContent = "Fout! Opnieuw proberen.";
    }
}

/**
 * Adds 'change' event listeners to all checkboxes on the page.
 * When a checkbox changes, it updates the "Save" button text.
 */
function initializeCheckboxChangeListeners() {
    const inputElements = document.querySelectorAll('input[type="checkbox"]');
    const saveButton = document.getElementById("btnSave");

    inputElements.forEach(input => {
        input.addEventListener('change', () => {
            if (saveButton) {
                saveButton.textContent = "Opslaan";
            }
        });
    });
}
