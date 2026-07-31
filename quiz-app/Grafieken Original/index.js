/*
 * Function: setLocation
 * Description: Checks which checkboxes are checked and redirects to the correct page with the URL parameters.
 */
function setLocation() {
    // Get the values of the checkboxes
    const actief = document.getElementById('actief').checked;
    const archief = document.getElementById('gearchiveerd').checked;
    const bezocht = document.getElementById('bezocht').checked;
    const nieuw = document.getElementById('nietbezocht').checked;

    console.log("Configuration:", actief, archief, bezocht, nieuw);

    const warningElement = document.getElementById('ongeldigeOptie');

    // Reset warning visibility
    warningElement.style.display = "none";

    // Validation: at least one option from the left side (actief/gearchiveerd) 
    // and one from the right side (bezocht/nieuw) should be selected.
    if ((!actief && !archief) || (!bezocht && !nieuw)) {
        warningElement.style.display = "block";
        return; // Stop the function here so we don't redirect
    }

    // Configuration of url parameters for grafieken.html
    // URL-format: ?bezocht=x&enable=x (x = true or false)
    if (actief && archief && bezocht && nieuw) {
        // Base url, no parameters needed if everything is selected
        location.href = "grafieken.html"; 
    } 
    else if (bezocht && nieuw) {
        location.href = "grafieken.html?enable=" + actief;
    } 
    else if (actief && archief) {
        location.href = "grafieken.html?bezocht=" + bezocht;
    } 
    else {
        location.href = "grafieken.html?enable=" + actief + "&bezocht=" + bezocht;
    }
}