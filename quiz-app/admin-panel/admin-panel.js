let robotActive = null; //Zet op null om verkeerde status te vermijden

document.addEventListener('DOMContentLoaded', () => {
    robotActive = socket.emit("robot-askIsActive");
    updatePowerButtonUI();
});

socket.on("robot-isActive", (data) => {
    robotActive = data.robotActive;
    updataPowerButtonUI();
})

function updatePowerButtonUI() {
    const btn = document.getElementById("powerToggleBtn"); 
    const text = document.getElementById("powerToggleText");
    const subtext = document.getElementById("powerToggleSubText");
    const iconWake = document.getElementById("iconWake");
    const iconSleep = document.getElementById("iconSleep");

    if (robotActive) {
        text.textContent = "Hugoo is aan het werk";
        subtext.textContent = "Klik om Hugoo uit te schakelen";
        text.classList.remove("power-text-shutdown", "power-text-inactive");
        text.classList.add("power-text-activate");
        
        btn.classList.remove("power-border-shutdown", "power-border-inactive");
        btn.classList.add("power-border-activate");
        
        iconWake.className = "power-icon icon-active-wake";
        iconSleep.className = "power-icon icon-inactive";
        
    } else if (robotActive === false) {
        text.textContent = "Hugoo slaapt";
        subtext.textContent = "Klik om Hugoo in te schakelen";
        text.classList.remove("power-text-activate", "power-text-inactive");
        text.classList.add("power-text-shutdown");
        
        btn.classList.remove("power-border-activate", "power-border-inactive");
        btn.classList.add("power-border-shutdown");
        
        iconWake.className = "power-icon icon-inactive";
        iconSleep.className = "power-icon icon-active-sleep"; 
        
    } else { //Dit vangt null of undefined op
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

    // Maak de knop even niet klikbaar
    btn.disabled = true;

    //Slaag tijdelijk lokaal op om de switch te kunnen zien
    const CurrentRobotActive = robotActive
    if (CurrentRobotActive === null){return;}

    if (CurrentRobotActive) {
        const confirmShutdown = confirm("Weet je zeker dat je Hugoo wilt uitschakelen? Hij zal de huidige taken afbreken en naar het laadstation rijden.");
        if (!confirmShutdown) return; 
        CurrentRobotActive = false; 
    } else {
        CurrentRobotActive = true;
    }

    updatePowerButtonUI();
    
    socket.emit("robot-activeButtonToggled", !CurrentRobotActive);
    
    setTimeout(() => {
        robotActive = socket.emit("robot-askIsActive"); //Vraag opnieuw naar de status
    }, 600);

    setTimeout(() => {
        if (robotActive !== CurrentRobotActive){
            btn.disabled = false;
            if (typeof backToQuiz === "function") backToQuiz();
        } else {
            btn.disabled = false;
            alert("Robot kon niet worden opgestart");
        }
    }, 400);
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
