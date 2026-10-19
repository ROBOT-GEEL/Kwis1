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

async function greyOutWaitForBT(buttonElement) {
    if (!buttonElement) return; 
    buttonElement.classList.add('settings-btn-nonActive');
    buttonElement.disabled = true; 

    try {
        await new Promise((resolve, reject) => {
            
            const timeout = setTimeout(() => {
                reject(new Error("timeout")); // Dit activeert de 'catch' blok
            }, 600000); 

            socket.once("robot-ready", (data = null) => {
                clearTimeout(timeout); // Stop de timer, de robot is er!
                resolve(); // Dit laat de 'await' succesvol afronden
            });
        });
        console.log("Robot is klaar!"); 

    } catch (error) {
        alert("Er liep iets mis bij de opstart van de robot.");
        
    } finally {
        buttonElement.classList.remove('settings-btn-nonActive');
        buttonElement.disabled = false;
    }
}

function waitForRobotReadyAfterDisconnect(timeoutMs = 600000) {
    let disconnected = false;
    let timeout;

    let resolveWait;
    let rejectWait;

    const promise = new Promise((resolve, reject) => {
        resolveWait = resolve;
        rejectWait = reject;
    });

    const cleanup = () => {
        clearTimeout(timeout);
        socket.off("robot-disconnected", onRobotDisconnected);
        socket.off("robot-ready", onRobotReady);
    };

    const onRobotDisconnected = () => {
        disconnected = true;
    };

    const onRobotReady = () => {
        if (!disconnected) {
            return;
        }

        cleanup();
        resolveWait();
    };

    socket.on("robot-disconnected", onRobotDisconnected);
    socket.on("robot-ready", onRobotReady);

    timeout = setTimeout(() => {
        cleanup();
        rejectWait(new Error("De Orin werd niet binnen 10 minuten opnieuw klaar."));
    }, timeoutMs);

    return {
        promise,
        cancel: () => {
            cleanup();
            resolveWait();
        }
    };
}

function rebootPiAfterOrinIsReady() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("De Pi bevestigde het rebootcommando niet."));
        }, 10000);

        socket.emit("screen-reboot", { type: "hard" }, (result) => {
            clearTimeout(timeout);

            if (!result || !result.success) {
                reject(new Error(
                    result?.message || "De Pi-reboot kon niet worden gestart."
                ));
                return;
            }

            resolve();
        });
    });
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

async function rebootRobot(type, buttonElement) {
    const originalButtonText = buttonElement?.querySelector(".btn-text")?.textContent;
    if (buttonElement) {
        buttonElement.disabled = true;
    }

    let adminSessionClosed = false;
    let robotReadyWaiter = null;

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
        else if (type === 'robot-hard' || type === 'robot-and-pi-hard') {
            const token = sessionStorage.getItem("adminToken");
            if (!token) {
                throw new Error("De admin-token ontbreekt; de reboot is afgebroken.");
            }

            await window.closeAdminPanelForReboot({
                holdRobotStopped: type === 'robot-and-pi-hard'
            });
            adminSessionClosed = true;

            if (type === 'robot-and-pi-hard') {
                robotReadyWaiter = waitForRobotReadyAfterDisconnect();
                const buttonText = buttonElement?.querySelector(".btn-text");
                if (buttonText) {
                    buttonText.textContent =
                        "Orin herstart; wachten tot de robot klaar is...";
                }
            }

            const response = await fetch('/diagnose/reboot-robot', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || `HTTP-fout! Status: ${response.status}`);
            }

            console.log("Succes:", data.message); 

            if (type === 'robot-and-pi-hard') {
                const buttonText = buttonElement?.querySelector(".btn-text");
                if (buttonText) {
                    buttonText.textContent =
                        "Robot klaar; Raspberry Pi wordt herstart...";
                }

                await robotReadyWaiter.promise;
                await rebootPiAfterOrinIsReady();
            } else {
                window.location.href = "../";
            }

            adminSessionClosed = false;
            sessionStorage.removeItem("adminToken");
        } 
        else if (type === 'pi-hard') {
            socket.emit('screen-reboot', { type: 'hard' });
        }
        else if (type === 'shutdown-pi') {
            socket.emit('screen-reboot', { type: 'shutdown' });
        }
    } catch (error) {
        if (robotReadyWaiter) {
            robotReadyWaiter.cancel();
        }

        if (adminSessionClosed) {
            try {
                await window.restoreAdminSessionAfterFailedReboot();
            } catch (restoreError) {
                console.error("Adminsessie kon niet worden hersteld:", restoreError.message);
                error.message += ` De adminsessie kon ook niet worden hersteld: ${restoreError.message}`;
            }
        }

        console.error("Fout tijdens het herstarten:", error.message);
        if (buttonElement) {
            buttonElement.disabled = false;
            const buttonText = buttonElement.querySelector(".btn-text");
            if (buttonText) {
                buttonText.textContent = originalButtonText;
            }
        }
        alert(`De Orin kon niet veilig worden herstart: ${error.message}`);
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

let isExpanding = true; // Vervangt je isExpaning variabele

function toggleAllDiagnose() {
    // Haal alle details elementen op als een Array zodat we handige filter() functies kunnen gebruiken
    const allDetails = Array.from(document.querySelectorAll('#diagnoseBox details'));
    
    if (allDetails.length === 0) return;

    // Check of alles open of dicht is (handig voor als de gebruiker zelf handmatig geklikt heeft)
    const fullyOpen = allDetails.every(detail => detail.hasAttribute('open'));
    const fullyClosed = allDetails.every(detail => !detail.hasAttribute('open'));

    // Corrigeer de richting als we aan het uiterste einde zijn
    if (fullyOpen) isExpanding = false;
    if (fullyClosed) isExpanding = true;

    if (isExpanding) {
        // UITKLAPPEN: Zoek alle gesloten details waarvan de parent-details wél al open is (of die geen parent hebben)
        const toOpen = allDetails.filter(detail => {
            const parentDetails = detail.parentElement.closest('details');
            return !detail.hasAttribute('open') && (!parentDetails || parentDetails.hasAttribute('open'));
        });

        // Klap alleen dit niveau open
        toOpen.forEach(detail => detail.setAttribute('open', ''));

        // Als hiermee het allerlaatste niveau is geopend, wissel de richting voor de volgende klik
        if (allDetails.every(detail => detail.hasAttribute('open'))) {
            isExpanding = false;
        }
    } else {
        // INKLAPPEN: Zoek alle open details die zélf geen open onderliggende details hebben (de diepste open laag)
        const toClose = allDetails.filter(detail => {
            return detail.hasAttribute('open') && !detail.querySelector('details[open]');
        });

        // Klap dit diepste niveau dicht
        toClose.forEach(detail => detail.removeAttribute('open'));

        // Als hiermee het allerlaatste niveau is gesloten, wissel de richting voor de volgende klik
        if (allDetails.every(detail => !detail.hasAttribute('open'))) {
            isExpanding = true;
        }
    }

    // Update de tekst op de knop
    const btnText = document.getElementById('toggleAllBtnText');
    if (btnText) {
        // Je kunt deze teksten aanpassen naar wens, 'Verder' is logischer bij stapsgewijs werken
        btnText.innerText = isExpanding ? 'Verder uitklappen' : 'Verder inklappen'; 
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

        isExpaning = true;
        document.getElementById('toggleAllBtnText').innerText = 'Verder inklappen';

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
