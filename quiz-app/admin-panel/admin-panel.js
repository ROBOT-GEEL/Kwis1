async function toggleProjector(state) {
    // Check if a state was actually passed
    if (!state) {
        console.error("No command given in toggleProjector function");
        return;
    }

    console.log("Sending command to projector:", state);

    let response;
    try {
        // Send a POST request to the server with the state in the body
        response = await fetch('/projector-control/toggle', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({projectorState: String(state)})
        });
    } catch (error) {
        console.error("Network error while communicating with the server:", error);
        showHardwareError("Er ging iets mis bij het communiceren met de server");
        return; // Exit on network error
    }

    // Try to parse the JSON response
    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        console.error("Error parsing JSON from server:", parseError);
        showHardwareError("Er ging iets mis bij het communiceren met de projector");
        return; // Exit on parse error
    }

    // Check if the HTTP request failed OR if the backend reported a logical error
    if (!response.ok || !data.success) {
        console.error(`Error (${response.status}):`, data.error || "Unknown error occurred");
        showHardwareError(`${data.error} (${data.details})` || "Er ging iets mis bij het communiceren met de projector");
        return; // Exit on API error
    }

    // If everything went smoothly
    console.log("Success:", data.message);
    disableHardwareError();
}

/**
 * Function to display an error message
 * @param {string} message - The error message to display
 */
function showHardwareError(message) {
    const errorContainer = document.getElementById('hardwareErrorContainer');
    const errorText = document.getElementById('errorText');

    if (message) {
        errorText.textContent = message;
        errorContainer.style.display = 'block';
    } else {
        // Hide if message is empty
        errorContainer.style.display = 'none';
    }
}


/**
 * Function to hide the error message
 */
function disableHardwareError() {
    const errorContainer = document.getElementById('hardwareErrorContainer');
    errorContainer.style.display = 'none';
}

/**
 * Logica voor aan en uitzetten van de robot
 */

let isRobotActive = false;

// Controleer direct de status wanneer de pagina laadt
document.addEventListener('DOMContentLoaded', () => {
    retrieveRobotStatus();
});

// 1. Haal de huidige status van de robot op
function retrieveRobotStatus() {
    fetch('/cms/getSettings')
        .then(response => response.json())
        .then(settings => {
            if (settings.robotActive !== undefined) {
                isRobotActive = settings.robotActive;
                updatePowerButtonUI();
            }
        })
        .catch(error => {
            console.error(`Fout bij het ophalen van instellingen: ${error}`);
            document.getElementById("powerToggleText").textContent = "Fout bij laden";
        });
}

// 2. Pas de knop en iconen aan op basis van de isRobotActive variabele
function updatePowerButtonUI() {
    const btn = document.getElementById("powerToggleBtn"); 
    const text = document.getElementById("powerToggleText");
    const subtext = document.getElementById("powerToggleSubText");
    const iconWake = document.getElementById("iconWake");
    const iconSleep = document.getElementById("iconSleep");

    if (isRobotActive) {
        // Robot staat AAN (Actie = Uitschakelen)
        text.textContent = "Hugoo is aan het werk";
        subtext.textContent = "Klik om Hugoo uit te schakelen"
        
        // Tekst groen maken
        text.classList.remove("power-text-shutdown");
        text.classList.add("power-text-activate");
        
        // Groene rand toevoegen, rode rand weghalen
        btn.classList.remove("power-border-shutdown");
        btn.classList.add("power-border-activate");
        
        // Wake icoon licht op, Sleep icoon wordt grijs
        iconWake.className = "power-icon icon-active-wake";
        iconSleep.className = "power-icon icon-inactive";
    } else {
        // Robot staat UIT (Actie = Inschakelen)
        text.textContent = "Hugoo slaapt";
        subtext.textContent = "Klik om Hugoo in te schakelen"

        // Tekst rood maken
        text.classList.remove("power-text-activate");
        text.classList.add("power-text-shutdown");
        
        // Rode rand toevoegen, groene rand weghalen
        btn.classList.remove("power-border-activate");
        btn.classList.add("power-border-shutdown");
        
        // Sleep icoon licht op, Wake icoon wordt grijs
        iconWake.className = "power-icon icon-inactive";
        iconSleep.className = "power-icon icon-active-sleep"; 
    }
}

// 3. Actie wanneer er op de knop geklikt wordt
async function toggleRobotPower() {
    const originalState = isRobotActive;

    if (isRobotActive) {
        // Schakel uit: vraag om bevestiging
        const confirmShutdown = confirm("Weet je zeker dat je Robotoo wilt uitschakelen? Hij zal de huidige taken afbreken en naar het laadstation rijden.");
        if (!confirmShutdown) return; 
        isRobotActive = false; // Tijdelijke state wissel
    } else {
        // Schakel in: geen waarschuwing nodig
        isRobotActive = true; 
    }

    // Update de UI alvast zodat het snel aanvoelt (Optimistic UI update)
    updatePowerButtonUI();

    // Sla op naar de backend
    const success = await saveRobotStateToServer(isRobotActive);

    if (success) {
        console.log(`Robot succesvol ${isRobotActive ? 'ingeschakeld' : 'uitgeschakeld'}.`);
    } else {
        alert("Er is iets misgegaan bij het wijzigen van de status. Probeer het opnieuw.");
        // Herstel de knop als de server faalt
        isRobotActive = originalState;
        updatePowerButtonUI();
    }
}

// 4. Update specifiek de robot status in de backend
async function saveRobotStateToServer(isActive) {
    try {
        const response = await fetch('/cms/getSettings');
        const currentSettings = await response.json();

        // Verwijder het _id veld hier in de frontend, zodat de backend onveranderd kan blijven!
        delete currentSettings._id;

        // Pas de robot status aan
        currentSettings.robotActive = isActive;

        // Stuur de opgeschoonde instellingen weer terug
        const saveResponse = await fetch('/cms/saveSettings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                settingsDict: currentSettings
            })
        });

        return saveResponse.ok;
    } catch (error) {
        console.error('Fout bij opslaan van de robot status:', error);
        return false;
    }
}

/**
 * Logica voor batterijniveau
 */

document.addEventListener("DOMContentLoaded", () => {
    socket.emit("robot-get-battery-percentage"); 
});

// 2. Luister naar het antwoord van de robot/server
socket.on("robot-update-battery-percentage", (data) => {
    console.log(data);
    const batteryText = document.getElementById("batteryPercentage");
    
    if (batteryText && data && data.battery !== undefined) {
        batteryText.textContent = data.battery + "%";
        
        // Optionele bonus: Maak de tekst rood als de batterij onder de 20% zakt
        if (data.battery <= 20) {
            batteryText.style.color = "var(--red)";
        } else {
            batteryText.style.color = "var(--darkGreen, #005144)";
        }
    }
});
