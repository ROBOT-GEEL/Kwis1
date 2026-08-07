/**
 * Script for handling global Socket.IO events.
 * Depends on:
 * - app.js (socket)
 * - utils.js (changeScreen)
 * - quiz.js (Quiz)
 */

// ==========================================
// SOCKET LISTENERS
// ==========================================

socket.on('robot-startup', () => { 
    changeScreen('robot-startup-screen'); 
});

socket.on('robot-lost-charging', () => { 
    changeScreen('robot-lost-charging'); 
});

socket.on('robot-explore', () => { 
    changeScreen('robot-explore-screen');

    const interval = setInterval(() => {
        if (document.querySelector('#robot-explore-screen').style.display === 'none') {
            clearInterval(interval);
            return;
        }
        let selectedLanguageIndex = 0;
        document.querySelectorAll('.language-selector').forEach((el, index) => {
            if (el.classList.contains('selected-language')) {
                selectedLanguageIndex = index;
            }
        });
        document.querySelectorAll('.language-selector')[(selectedLanguageIndex + 1) % 3].click();
    }, 2100);
});

socket.on('robot-arrived-at-visitors', () => { 
    changeScreen('start-screen');

    if (Quiz.timeToStartQuiz > 0) {
        console.log('Waiting for quiz to start...');
        setTimeout(() => {
            console.log(`Quiz inactive: ${document.querySelector('#start-screen').style.display === 'block'}`);
            if (document.querySelector('#start-screen').style.display === 'block') {
                socket.emit('quiz-inactive');
            }
        }, Quiz.timeToStartQuiz * 1000);
    }
});

socket.on('robot-arrived-at-quiz-location', async () => { 
    console.log('Robot has arrived at the quiz location!');
    try {
        await Quiz.start();
    } catch (e) {
        error(e);
        return;
    }
});

socket.on('robot-go-charge', () => { 
    changeScreen('robot-go-charge-screen'); 
});

socket.on('admin-panel-open', () => { 
    Quiz.abortByScreenChange("Adminpaneel geopend");
});

socket.on('robot-docking', () => { 
    console.log('Docking ontvangen');
    changeScreen('robot-docking-screen');
});

socket.on('robot-charging', () => { 
    changeScreen('robot-charging-screen'); 
});

socket.on('robot-error-drive', () => { 
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>Hugoo is verdwaald...</h1><p>Gelieve dit aan het onthaal te melden.</p>`;
});

socket.on('robot-error-charge', () => { 
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>Hugoo kan het laadstation niet vinden.</h1><p>Open het admin-paneel, ga naar diagnose en volg daar de rebootprocedure.</p>`;
});

socket.on('robot-disconnected', () => { 
    changeScreen('error-screen');
    document.querySelector('#error-container').innerHTML = `<h1>De verbinding met het besturingssysteem is verloren gegaan.</h1><p>Even geduld aub...</p>`;
});

socket.on('robot-connected', () => { 
    changeScreen('robot-startup-screen'); 
});

socket.on('follow-robot-screen', () => { 
    changeScreen('follow-robot-screen'); 
});

socket.on("robot-bumper-status", (status) => {    
    const allePijlen = [
        'voor', 'achter', 'links', 'rechts', 
        'linksboven', 'rechtsboven', 'linksonder', 'rechtsonder'
    ];

    if (status && status.msg && (status.msg !== "De bumper is niet ingedrukt")) {
        // 1. Toon het bumper-alert scherm
        document.getElementById('bumper-alert').style.display = 'block';
        
        // 2. Haal de 'actief' class weg bij alle pijlen (reset)
        allePijlen.forEach(richting => {
            const pijl = document.getElementById(`pijl-${richting}`);
            if (pijl) {
                pijl.classList.remove('actief');
            }
        });
        
        // Zet de tekst om naar kleine letters voor veilig zoeken
        const msg = status.msg.toLowerCase();
        
        // 3. Check welke woorden er precies in de status staan
        const voor = msg.includes("vooraan");
        const achter = msg.includes("achteraan");
        const links = msg.includes("links");
        const rechts = msg.includes("rechts");

        // Hulpfunctie om de code schoon te houden
        const activeerPijl = (richting) => {
            const pijl = document.getElementById(`pijl-${richting}`);
            if (pijl) pijl.classList.add('actief');
        };

        // 4. Bepaal welke pijlen moeten oplichten (meerdere tegelijk mogelijk!)
               
        if (voor) activeerPijl('achter');
        if (achter) activeerPijl('voor');
        if (links) activeerPijl('links');
        if (rechts) activeerPijl('rechts');

        // Schuine kanten (hoeken) omgedraaid
        if (voor && links) activeerPijl('linksonder');
        if (voor && rechts) activeerPijl('rechtsonder');
        if (achter && links) activeerPijl('linksboven');
        if (achter && rechts) activeerPijl('rechtsboven');

    } else {
        // De bumper is weer los: Verberg het alert
        document.getElementById('bumper-alert').style.display = 'none';
        
        // Reset ook alle pijlen weer
        allePijlen.forEach(richting => {
            const pijl = document.getElementById(`pijl-${richting}`);
            if (pijl) {
                pijl.classList.remove('actief');
            }
        });
    }
});