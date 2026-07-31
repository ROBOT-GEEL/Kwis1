function validateInputs() {
    const numericFieldIds = [
        "answerTime", "maxQuestions", "nextQuestionDelay", 
        "timeToStartQuiz", "instructionsScreenTime", "finishedScreenTime"
    ];
    
    for (const id of numericFieldIds) {
        const value = document.getElementById(id).value;
        if (!value || parseInt(value) < 1) {
            alert("Zorg ervoor dat alle numerieke velden correct zijn ingevuld (minimaal 1).");
            return false;
        }
    }
    return true;
}

async function buttonSaveSettings() {
    if (!validateInputs()) {
        return false;
    }

    const saveBtn = document.getElementById("buttonSaveSettings");
    if (saveBtn) saveBtn.textContent = "Opslaan...";
    
    try {
        var settingsDict = {};
        
        settingsDict.answerTime = parseInt(document.getElementById("answerTime").value);
        settingsDict.maxQuestions = parseInt(document.getElementById("maxQuestions").value);
        settingsDict.nextQuestionDelay = parseInt(document.getElementById("nextQuestionDelay").value);
        settingsDict.instructionsScreenTime = parseInt(document.getElementById("instructionsScreenTime").value);
        settingsDict.finishedScreenTime = parseInt(document.getElementById("finishedScreenTime").value);
        settingsDict.timeToStartQuiz = parseInt(document.getElementById("timeToStartQuiz").value);
        settingsDict.cancelInactiveQuiz = document.getElementById("cancelInactiveQuizCheckbox").checked;

        const response = await fetch('/cms/saveSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            keepalive: true,
            body: JSON.stringify({ settingsDict })
        });

        if (response.ok) {
            console.log("Settings saved successfully");
            if (saveBtn) saveBtn.textContent = "Opgeslagen";
            return true;
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error:', error);
        if (saveBtn) saveBtn.textContent = "Fout bij opslaan";
        return false;
    }
}

function retrieveSettings() {
    fetch('/cms/getSettings')
    .then(response => response.json())
    .then(Settings => {
        document.getElementById("answerTime").value = Settings.answerTime;
        document.getElementById("maxQuestions").value = Settings.maxQuestions;
        document.getElementById("nextQuestionDelay").value = Settings.nextQuestionDelay;
        document.getElementById("cancelInactiveQuizCheckbox").checked = Settings.cancelInactiveQuiz;
        document.getElementById("instructionsScreenTime").value = Settings.instructionsScreenTime;
        document.getElementById("finishedScreenTime").value = Settings.finishedScreenTime;
        document.getElementById("timeToStartQuiz").value = Settings.timeToStartQuiz;
               
        const saveBtn = document.getElementById("buttonSaveSettings");
        if (saveBtn) saveBtn.textContent = "Opgeslagen";
    })
    .catch(error => console.error(`Error getting Settings: ${error}`));
}

function initializeSettingsChangeListeners() {
    const inputElements = document.querySelectorAll('input[type="number"], input[type="checkbox"]');
    inputElements.forEach(input => {
        input.addEventListener('input', async () => {
            await buttonSaveSettings(); 
        });
    });

    const spinnerButtons = document.querySelectorAll('.spinner-btn');
    spinnerButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(async () => {
                await buttonSaveSettings();
            }, 50);
        });
    });

    const btnBack = document.getElementById("btnBack");
    if (btnBack) {
        btnBack.addEventListener("click", async (e) => {
            e.preventDefault(); 
            
            const textSpan = btnBack.querySelector(".btn-text");
            if (textSpan) {
                textSpan.textContent = "Opslaan...";
            }
            
            await buttonSaveSettings(); 
            window.location.href = '../admin-panel'; 
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsChangeListeners();
    retrieveSettings();
});