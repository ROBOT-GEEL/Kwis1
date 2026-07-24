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
    console.log(`Saving checkbox state to ${endpoint} with property ${propertyName}`);
    const saveButton = document.getElementById(buttonId);
    saveButton.textContent = "Opslaan...";

    const switches = document.querySelectorAll('.enableSwitch'); // Class is always .enableSwitch
    const questionDict = {};

    // Collect the state of each checkbox
    switches.forEach(enableSwitch => {
        const questionId = enableSwitch.closest('[id]').id;
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


