let robotActive = null; 

socket.on("robot-isActive", (data) => {
    robotActive = data;
    updatePowerButtonUI();
});

document.addEventListener('DOMContentLoaded', () => {
    // Vraag enkel de status op, de wijziging gebeurt via socket.on
    socket.emit("robot-askIsActive");
    updatePowerButtonUI();
});


function updatePowerButtonUI(UIRobotActive = robotActive) {
    const btn = document.getElementById("powerToggleBtn"); 
    const text = document.getElementById("powerToggleText");
    const subtext = document.getElementById("powerToggleSubText");
    const iconWake = document.getElementById("iconWake");
    const iconSleep = document.getElementById("iconSleep");

    if (UIRobotActive === true) {
        text.textContent = "Hugoo is aan het werk";
        subtext.textContent = "Klik om Hugoo uit te schakelen";
        text.classList.remove("power-text-shutdown", "power-text-inactive");
        text.classList.add("power-text-activate");
        
        btn.classList.remove("power-border-shutdown", "power-border-inactive");
        btn.classList.add("power-border-activate");
        
        iconWake.className = "power-icon icon-active-wake";
        iconSleep.className = "power-icon icon-inactive";
        
    } else if (UIRobotActive === false) {
        text.textContent = "Hugoo slaapt";
        subtext.textContent = "Klik om Hugoo in te schakelen";
        text.classList.remove("power-text-activate", "power-text-inactive");
        text.classList.add("power-text-shutdown");
        
        btn.classList.remove("power-border-activate", "power-border-inactive");
        btn.classList.add("power-border-shutdown");
        
        iconWake.className = "power-icon icon-inactive";
        iconSleep.className = "power-icon icon-active-sleep"; 
        
    } else { // Dit vangt null of undefined op
        text.textContent = "Status wordt opgehaald";
        subtext.textContent = "Even geduld...";
        text.classList.remove("power-text-activate", "power-text-shutdown");
        text.classList.add("power-text-inactive");
        
        btn.classList.remove("power-border-activate", "power-border-shutdown");
        btn.classList.add("power-border-inactive");
        
        iconWake.className = "power-icon icon-inactive";
        iconSleep.className = "power-icon icon-inactive"; 
    }
}

async function toggleRobotPower() {
    const btn = document.getElementById("powerToggleBtn");
    
    if (robotActive === null || btn.disabled) return;

    if (robotActive) {
        const confirmShutdown = confirm("Weet je zeker dat je Hugoo wilt uitschakelen? Hij zal de huidige taken afbreken en naar het laadstation rijden.");
        if (!confirmShutdown) return; 
    }

    btn.disabled = true;
    const previousStatus = robotActive;
    const expectedStatus = !robotActive;
    
    updatePowerButtonUI(expectedStatus); // Optimistische UI update (we doen alsof het al gelukt is)
    
    try {
        // Wacht op het resultaat van de robot
        const newActualStatus = await new Promise((resolve, reject) => {
            
            // Timer 1: Vraag na 1 seconde de status nog eens expliciet op
            const askTimer = setTimeout(() => {
                socket.emit("robot-askIsActive");
            }, 1000);

            // Timer 2: Na 2,5 seconde stopt het wachten in een error
            const timeoutTimer = setTimeout(() => {
                socket.off("robot-isActive", responseHandler); // Verwijder de eenmalige luisteraar
                reject(new Error("timeout"));
            }, 5000);

            // De handler die de data opvangt
            const responseHandler = (data) => {
                clearTimeout(askTimer);
                clearTimeout(timeoutTimer);
                resolve(data); // Geef de ontvangen data terug aan de Promise
            };

            socket.once("robot-isActive", responseHandler); // Gebruik .once zodat deze specifieke handler maar 1x reageert

            // Verstuur het initiele commando
            socket.emit("robot-activeButtonToggled", expectedStatus);
        });

        // -- Als de code hier komt, is de Promise succesvol afgerond! --
        robotActive = newActualStatus;

        if (previousStatus !== robotActive) {
            window.location.href = "../"; // Succesvolle status-wissel
        } else {
            alert("De wijziging is niet geaccepteerd door de robot. Probeer het opnieuw.");
            updatePowerButtonUI(); // UI synchroniseren met ware status
        }

    } catch (error) {
        // -- Als de code hier komt, was er een timeout --
        alert("Er was een probleem met de verbinding, probeer het opnieuw.");
        robotActive = previousStatus; // Zet lokale variabele terug
        updatePowerButtonUI(); // Herstel de foutieve optimistische UI
    } finally {
        // -- Dit wordt altijd uitgevoerd, succes of falen --
        btn.disabled = false;
    }
}

/**
 * Logica voor batterijniveau
 */

document.addEventListener("DOMContentLoaded", () => {
    socket.emit("robot-get-battery-percentage"); 
});
// Update de batterijspanning iedere minuut
setInterval(() => {
    socket.emit("robot-get-battery-percentage");
}, 60000);

// 2. Luister naar het antwoord van de robot/server
socket.on("robot-update-battery-percentage", (data) => {
    console.log(data);
    const batteryText = document.getElementById("batteryPercentage");

    if (data.battery === null) {
    batteryText.textContent = "Loading...";
    batteryText.style.color = "var(--darkGreen)";
    batteryIcon.style.color = "var(--darkGreen)"; // Icoon kleur aangepast

} else {
    batteryText.textContent = data.battery + " Volt";

    if (data.battery >= data.batteryHigh) {
        batteryText.style.color = "var(--green)";
        batteryIcon.style.color = "var(--green)";
    } else if (data.battery >= data.batteryLow) {
        batteryText.style.color = "var(--orange)";
        batteryIcon.style.color = "var(--orange)";
    } else {
        batteryText.style.color = "var(--red)";
        batteryIcon.style.color = "var(--red)";
    }
}
});
