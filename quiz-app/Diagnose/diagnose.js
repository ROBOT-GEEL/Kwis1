async function greyOut(buttonElement){
    if (buttonElement) {
        buttonElement.classList.add('settings-btn-nonActive');
        buttonElement.disabled = true; 
        setTimeout(() => {
            buttonElement.classList.remove('settings-btn-nonActive');
            buttonElement.disabled = false;
        }, 3000);
    }
}

socket.on("robot-bumper-status", (status) => {    
    console.log("bumper", status.msg);
    const errorContainerBumper = document.getElementById('hardwareErrorContainerBumper');
    const errorTextBumper = document.getElementById('errorTextBumper');
    const noErrorTextBumper = document.getElementById('noErrorTextBumper');

    if (status && status.msg) {   
        if (status.msg !== "De bumper is niet ingedrukt") {
            errorTextBumper.textContent = status.msg;
            noErrorTextBumper.style.display = 'none';
            errorContainerBumper.style.display = 'block';
        } else {
            noErrorTextBumper.textContent = status.msg;
            errorContainerBumper.style.display = 'none';
            noErrorTextBumper.style.display = 'block';
        }
    } else {
        noErrorTextBumper.textContent = "Even geduld...";
        errorContainerBumper.style.display = 'none';
        noErrorTextBumper.style.display = 'block';
    }
});

async function rebootRobot(type) {
    try {
        if (type === 'robot-soft') {
            const response = await fetch('/diagnose/reboot-soft-robot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP-fout! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Succes:", data.message); 

        } else if (type === 'shutdown-robot') {
            const response = await fetch('/diagnose/shutdown-robot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP-fout! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Succes:", data.message); 
        } 
        else if (type === 'robot-hard') {
            const response = await fetch('/diagnose/reboot-robot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP-fout! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Succes:", data.message); 
        } 
        else if (type === 'pi-hard') {
            socket.emit('screen-reboot', { type: 'hard' });
        }
    } catch (error) {
        console.error("Fout tijdens het herstarten:", error.message);
    }
}

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
        showHardwareErrorProjector("Er ging iets mis bij het communiceren met de server");
        return; // Exit on network error
    }

    // Try to parse the JSON response
    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        console.error("Error parsing JSON from server:", parseError);
        showHardwareErrorProjector("Er ging iets mis bij het communiceren met de projector");
        return; // Exit on parse error
    }

    // Check if the HTTP request failed OR if the backend reported a logical error
    if (!response.ok || !data.success) {
        console.error(`Error (${response.status}):`, data.error || "Unknown error occurred");
        showHardwareErrorProjector(`${data.error} (${data.details})` || "Er ging iets mis bij het communiceren met de projector");
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
function showHardwareErrorProjector(message) {
    const errorContainerProjector = document.getElementById('hardwareErrorContainerProjector');
    const errorTextProjector = document.getElementById('errorTextProjector');

    if (message) {
        errorTextProjector.textContent = message;
        errorContainerProjector.style.display = 'block';
    } else {
        // Hide if message is empty
        errorContainerProjector.style.display = 'none';
    }
}

/**
 * Function to hide the error message
 */
function disableHardwareError() {
    const errorContainer = document.getElementById('hardwareErrorContainerProjector');
    errorContainer.style.display = 'none';
}

/**
 * Toggle functie voor de knop: Alles in- of uitklappen
 */
let allExpanded = true; // We starten standaard met alles opengeklapt

function toggleAllDiagnose() {
    allExpanded = !allExpanded;
    const detailsElements = document.querySelectorAll('#diagnoseBox details');
    
    detailsElements.forEach(detail => {
        if (allExpanded) {
            detail.setAttribute('open', '');
        } else {
            detail.removeAttribute('open');
        }
    });

    const btnText = document.getElementById('toggleAllBtnText');
    if (btnText) {
        btnText.innerText = allExpanded ? 'Alles inklappen' : 'Alles uitklappen';
    }
}

/**
 * Haalt de diagnose data op
 */
let diagnoseBezig = false;

async function makeDiagnose(){
    const refreshknopText = document.getElementById('refresh-diagnose-text');
    const refreshknopButton = document.getElementById('refresh-diagnose-button');

    if (diagnoseBezig === true){
        refreshknopText.innerHTML="Even geduld..."
        return
    }
    diagnoseBezig = true

    refreshknopText.innerHTML="diagnose ophalen..."
    refreshknopButton.classList.add('settings-btn-nonActive');

    const diagnoseBox = document.getElementById('diagnoseBox');
    try {
        const response = await fetch('/diagnose/make-diagnose', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (!response.ok) {
            throw new Error(`HTTP-fout! Status: ${response.status}`);
        }

        let data = await response.json();
        
        // Verwijder success envelop
        let actualData = data;
        if ('success' in actualData) {
            if (actualData.data && typeof actualData.data === 'object') {
                actualData = actualData.data;
            } else if (actualData.message && typeof actualData.message === 'object') {
                actualData = actualData.message;
            } else {
                delete actualData.success;
            }
        }

        diagnoseBox.innerHTML = generateCleanHTML(actualData);

        allExpanded = true;
        document.getElementById('toggleAllBtnText').innerText = 'Alles inklappen';

        refreshknopText.innerHTML="Refresh diagnose"
        refreshknopButton.classList.remove('settings-btn-nonActive');
        diagnoseBezig = false;

    } catch (error) {
        refreshknopText.innerHTML="Refresh diagnose"
        refreshknopButton.classList.remove('settings-btn-nonActive');
        diagnoseBezig = false;
        console.error("Kon diagnose niet uitvoeren", error);
        diagnoseBox.innerHTML = "<span class='text-red'>Er is een fout opgetreden bij de diagnose.</span>";
    }
}

/**
 * Controleert recursief of er ergens in het object een property 'status' is met waarde false.
 */
function hasStatusFalse(obj) {
    if (!obj || typeof obj !== 'object') return false;
    
    for (const key in obj) {
        if (key.toLowerCase() === 'status' && obj[key] === false) return true;
        if (typeof obj[key] === 'object' && hasStatusFalse(obj[key])) return true;
    }
    return false;
}

/**
 * Controleert of een object zélf weer objecten bevat (zo nee, dan is het een diepste niveau)
 */
function hasNestedObjects(obj) {
    if (!obj || typeof obj !== 'object') return false;
    for (const key in obj) {
        if (key.toLowerCase() === 'status') continue;
        if (typeof obj[key] === 'object' && obj[key] !== null) return true;
    }
    return false;
}

/**
 * Zet het object om naar een cleane, inklapbare HTML structuur.
 */
function generateCleanHTML(obj, level = 0) {
    if (typeof obj !== 'object' || obj === null) {
        return `<span class="clean-val">${obj}</span>`;
    }

    let html = '';
    const keys = Object.keys(obj);
    
    keys.forEach((key) => {
        if (key.toLowerCase() === 'status') return;

        const val = obj[key];
        const isTopLevel = (level === 0);
        
        let rowClasses = ['clean-row'];
        if (isTopLevel) rowClasses.push('top-level-row');

        let keyClass = 'clean-key';
        let hasError = false;

        if (val && typeof val === 'object') {
            if (val.status === true) keyClass += ' text-green';
            if (val.status === false || hasStatusFalse(val)) {
                keyClass += ' text-red';
                hasError = true;
            }
        }

        html += `<div class="${rowClasses.join(' ')}">`;
        
        if (typeof val !== 'object' || val === null) {
            html += `<div><span class="${keyClass}">${key}</span>: <span class="clean-val">${val}</span></div>`;
        } else {
            
            // Check of we nog dieper kunnen inklappen
            const containsObjects = hasNestedObjects(val);

            if (containsObjects) {
                // Wel sub-objecten -> Maak het inklapbaar met <details>
                html += `<details class="clean-details" open>`;
                html += `<summary><span class="${keyClass}">${key}</span>`;
                if (hasError) html += `<span class="error-badge" title="Bevat een fout (status: false)">❗</span>`;
                html += `</summary>`;
                html += `<div class="clean-children">`;
                html += generateCleanHTML(val, level + 1);
                html += `</div>`;
                html += `</details>`;
            } else {
                // Geen sub-objecten -> Gewone div, geen pijltje (Diepste niveau)
                html += `<div class="clean-leaf-node">`;
                html += `<div class="clean-leaf-title"><span class="${keyClass}">${key}</span>`;
                if (hasError) html += `<span class="error-badge" title="Bevat een fout (status: false)">❗</span>`;
                html += `</div>`;
                html += `<div class="clean-children" style="border-left: 1px dashed var(--bgColor);">`;
                html += generateCleanHTML(val, level + 1);
                html += `</div>`;
                html += `</div>`;
            }
        }
        
        html += `</div>`;
    });
    
    return html;
}
