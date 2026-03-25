// Variable to keep track of the robot's active status
let isRobotActive = false;

// Variables for time management
let timeAutoUpdateInterval = null;
let isTimeManuallyEdited = false;

// Function to validate all inputs before saving
function validateInputs() {
    // Validate numeric quiz settings to ensure they are not empty and >= 1
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

    // Validate the daily schedule
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNamesNL = {
        'Mon': 'maandag', 'Tue': 'dinsdag', 'Wed': 'woensdag', 
        'Thu': 'donderdag', 'Fri': 'vrijdag', 'Sat': 'zaterdag', 'Sun': 'zondag'
    };

    for (const day of days) {
        const isActive = document.getElementById(`active${day}`).checked;
        const startTime = document.getElementById(`start${day}`).value;
        const endTime = document.getElementById(`end${day}`).value;

        if (isActive) {
            // If the day is active, both start and end times must be provided
            if (!startTime || !endTime) {
                alert(`Vul een begin- en einduur in voor ${dayNamesNL[day]}.`);
                return false;
            }

            // Start time must strictly be before the end time
            if (startTime >= endTime) {
                alert(`Het einduur moet later zijn dan het beginuur op ${dayNamesNL[day]}.`);
                return false;
            }
        }
    }

    // All checks passed
    return true;
}

// Function to fetch and update the true system time from the server headers
async function updateSystemTimeUI() {
    // Only update automatically if the user hasn't manually altered the inputs
    if (!isTimeManuallyEdited) {
        try {
            // Send a lightweight HEAD request to localhost to read the server's exact HTTP Date header.
            // This completely bypasses the browser's internal cached clock.
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const serverTimeStr = response.headers.get('Date');
            
            if (serverTimeStr) {
                const now = new Date(serverTimeStr);
                
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');

                document.getElementById("currentDate").value = `${yyyy}-${mm}-${dd}`;
                document.getElementById("currentTime").value = `${hours}:${minutes}`;
            }
        } catch (error) {
            console.error("Could not fetch true server time:", error);
        }
    }
}

async function buttonSaveSettings() {
    // Stop the save process if the validation fails
    if (!validateInputs()) {
        return false;
    }

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

        // Retrieve current date and time settings from the UI
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

        // Send the settings to the server
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
            
            // Give the Raspberry Pi 1 second to actually change the OS clock
            // before we fetch the new time from the server headers.
            setTimeout(() => {
                isTimeManuallyEdited = false;
                updateSystemTimeUI(); 
            }, 1000);

            return true;
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("buttonSaveSettings").textContent = "Fout bij opslaan";
        return false;
    }
}

function retrieveSettings() {
    // Fetch settings from server
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
        
        // Set button text to "Opgeslagen" upon successful retrieval of settings
        document.getElementById("buttonSaveSettings").textContent = "Opgeslagen";
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
        if (typeof backToQuiz === "function") backToQuiz();
    } else {
        console.error("Something went wrong while activating the robot. The settings could not be updated.");
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
            if (typeof backToQuiz === "function") backToQuiz();
        } else {
            console.error("Something went wrong while shutting down the robot. The settings could not be updated.");
            isRobotActive = true;
            updatePowerCards(true);
        }
    } else {
        // If the user cancels the confirmation, reset the active state
        isRobotActive = true;
    }
}

// Initialize listeners so the button resets to "Opslaan" when a setting changes
function initializeSettingsChangeListeners() {
    const inputElements = document.querySelectorAll('input[type="number"], input[type="checkbox"], input[type="time"], input[type="date"]');
    inputElements.forEach(input => {
        input.addEventListener('change', (e) => {
            document.getElementById("buttonSaveSettings").textContent = "Opslaan";
            
            // Pause auto-update if the user manually alters the date or time
            if (e.target.id === "currentDate" || e.target.id === "currentTime") {
                isTimeManuallyEdited = true;
            }
        });
    });

    // Add listeners for the custom SVG spinner buttons
    const spinnerButtons = document.querySelectorAll('.spinner-btn');
    spinnerButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById("buttonSaveSettings").textContent = "Opslaan";
        });
    });
}

// Start sequence
document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsChangeListeners();
    
    // Initialize system time immediately and start auto-updating every 15 seconds
    updateSystemTimeUI();
    timeAutoUpdateInterval = setInterval(updateSystemTimeUI, 15000);
});

retrieveSettings();