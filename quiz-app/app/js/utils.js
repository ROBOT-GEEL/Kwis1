/**
 * Script with utility functions for the Quiz Robot application.
 */

// Function to wait for a certain amount of time
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Change the screen to the specified screen.
 *
 * @param {string} screen The ID of the screen to show
 */
function changeScreen(screen) {
    const targetScreen = document.getElementById(screen);
    if (!targetScreen) {
        console.warn(`[Waarschuwing] Scherm '${screen}' bestaat niet in HTML. Val terug op 'robot-basis-screen'.`);
        screen = 'robot-basis-screen';
    }

    document.querySelectorAll('.screen').forEach(s => {
        s.style.display = (s.id === screen) ? 'block' : 'none';
    });

    if (screen !== "robot-arrived-at-quiz-location"){
        console.log("Ander scherm ontvangen dan robot-arrived-at-quiz-location");
        Quiz.abortByScreenChange("Ander scherm van BT ontvangen");
    }
}
