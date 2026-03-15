// Variable to keep track of the robot's active status
let isRobotActive = false;

async function buttonSaveSettings() {
    document.getElementById("buttonSaveSettings").textContent = "Opslaan...";
    try {
        // Store all the settings in a dictionary
        var settingsDict = {};
        
        // Parse standard quiz integers
        settingsDict.answerTime = parseInt(document.getElementById("answerTime").value);
        settingsDict.maxQuestions = parseInt(document.getElementById("maxQuestions").value);
        settingsDict.nextQuestionDelay = parseInt(document.getElementById("nextQuestionDelay").value);
        settingsDict.instructionsScreenTime = parseInt(document.getElementById("instructionsScreenTime").value);
        settingsDict.finishedScreenTime = parseInt(document.getElementById("finishedScreenTime").value);
        settingsDict.timeToStartQuiz = parseInt(document.getElementById("timeToStartQuiz").value);

        settingsDict.cancelInactiveQuiz = document.getElementById("cancelInactiveQuizCheckbox").checked;

        // Retrieve current date and time settings
        settingsDict.currentDate = document.getElementById("currentDate").value;
        settingsDict.currentTime = document.getElementById("currentTime").value;

        // Retrieve daily schedule settings
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        settingsDict.schedule = {};
        
        days.forEach(day => {
            settingsDict.schedule[day] = {
                active: document.getElementById(`active${day}`).checked,
                start: document.getElementById(`start${day}`).value,
                end: document.getElementById(`end${day}`).value
            };
        });

        // Add the robot status to the settings dictionary
        settingsDict.robotActive = isRobotActive;

        // Send the settings to the localhost server
        const response = await fetch('/cms/saveSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                settingsDict
            })
        });

        if (response.ok) {
            console.log("Settings saved successfully");
            document.getElementById("buttonSaveSettings").textContent = "Opgeslagen";
            return response.text();
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("buttonSaveSettings").textContent = "Fout bij opslaan";
    }
}

function retrieveSettings() {
    fetch('/cms/getSettings')
    .then(response => response.json())
    .then(Settings => {
        // Update the UI with the retrieved quiz settings
        document.getElementById("answerTime").value = Settings.answerTime;
        document.getElementById("maxQuestions").value = Settings.maxQuestions;
        document.getElementById("nextQuestionDelay").value = Settings.nextQuestionDelay;
        document.getElementById("cancelInactiveQuizCheckbox").checked = Settings.cancelInactiveQuiz;
        document.getElementById("instructionsScreenTime").value = Settings.instructionsScreenTime;
        document.getElementById("finishedScreenTime").value = Settings.finishedScreenTime;
        document.getElementById("timeToStartQuiz").value = Settings.timeToStartQuiz;
        
        // Update the UI with the retrieved system date and time
        if(Settings.currentDate) document.getElementById("currentDate").value = Settings.currentDate;
        if(Settings.currentTime) document.getElementById("currentTime").value = Settings.currentTime;
        
        // Update the UI with the retrieved daily schedule
        if(Settings.schedule) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            days.forEach(day => {
                if (Settings.schedule[day]) {
                    document.getElementById(`active${day}`).checked = Settings.schedule[day].active;
                    document.getElementById(`start${day}`).value = Settings.schedule[day].start;
                    document.getElementById(`end${day}`).value = Settings.schedule[day].end;
                }
            });
        }

        // Update the robot status and corresponding UI cards
        if(Settings.robotActive !== undefined) {
            isRobotActive = Settings.robotActive;
            updatePowerCards(isRobotActive);
        }
        
        document.getElementById("buttonSaveSettings").textContent = "Opslaan";
    })
    .catch(error => console.error(`Error getting Settings: ${error}`));
}

// Function to visually toggle the disabled state of the power cards
function updatePowerCards(isActive) {
    const cardActivate = document.getElementById("cardActivate");
    const cardShutdown = document.getElementById("cardShutdown");

    if (isActive) {
        // If active, activating is disabled and shutting down is enabled
        cardActivate.classList.add("disabled-card");
        cardShutdown.classList.remove("disabled-card");
    } else {
        // If inactive, activating is enabled and shutting down is disabled
        cardActivate.classList.remove("disabled-card");
        cardShutdown.classList.add("disabled-card");
    }
}

// Function to activate the robot and trigger a full save
async function activateRobot() {
    isRobotActive = true;
    // Save all settings, including the new status, to the server
    const saveSuccessful = await buttonSaveSettings();

    if (saveSuccessful) {
        console.log("Robot activated");

        // Close the settings page once the robot needs to turn on
        location.href='../'
    } else {
        console.error("Something went wrong while activating the robot. The settings could not be updated.")
        isRobotActive = false;
        updatePowerCards(false);
    }
    
}

// Function to show a warning, shutdown the robot, and trigger a full save
async function shutdownRobot() {
    isRobotActive = false;
    // Show confirmation dialog before proceeding
    const confirmShutdown = confirm("Weet je zeker dat je Robotoo wilt uitschakelen? Hij zal de huidige taken afbreken en naar het laadstation rijden.");
    
    if (confirmShutdown) {        
        // Save all settings, including the new status, to the server
        const saveSuccessful = await buttonSaveSettings();

        if (saveSuccessful) {
            console.log("Robot shutting down");
            
            // Close the settings page once the robot needs to turn off
            backToQuiz();
        } else {
            console.error("Something went wrong while shutting down the robot. The settings could not be updated.")
            isRobotActive = true;
            updatePowerCards(true);
        }
    }
}

// Initialize listeners so the button resets to "Opslaan" when a setting changes
function initializeSettingsChangeListeners() {
    const inputElements = document.querySelectorAll('input[type="number"], input[type="checkbox"], input[type="time"], input[type="date"]');
    inputElements.forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById("buttonSaveSettings").textContent = "Opslaan";
        });
    });

    // Add listeners for the newly added custom SVG spinner buttons
    const spinnerButtons = document.querySelectorAll('.spinner-btn');
    spinnerButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById("buttonSaveSettings").textContent = "Opslaan";
        });
    });
}

// Start sequence
document.addEventListener('DOMContentLoaded', initializeSettingsChangeListeners);
retrieveSettings();