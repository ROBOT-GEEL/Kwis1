document.addEventListener('DOMContentLoaded', () => {
    // Check of we in een iframe draaien
    if (window.self !== window.top) {
        const printButton = document.getElementById('print-button');
        if (printButton) {
            printButton.classList.add('settings-btn-nonActive');
        }
    }
});


function exportQuestions() {
     if (window.self !== window.top) {
        alert("Je kan de vragen niet exporteren vanop de robot. Raadpleeg de handleiding om via je eigen computer te connecteren.");
        return;
     }

    fetch('/cms/getQuestions')
        .then(response => response.json())
        .then(questions => {
            let iframe = document.getElementById('print-iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'print-iframe';
                iframe.style.position = 'absolute';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                document.body.appendChild(iframe);
            }

            const nu = new Date();
            const datumTijd = nu.toLocaleString('nl-BE', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            let htmlContent = `
                <!DOCTYPE html>
                <html lang="nl">
                <head>
                    <meta charset="UTF-8">
                    <title>Export Vragen</title>
                    <style>
                        :root {
                            --darkGreen: #005144;
                            --bgColor: #DAF5F0;
                        }
                        
                        body {
                            font-family: 'Open Sans', sans-serif;
                            margin: 10px;
                            font-size: 12px;
                            color: #000000;
                            line-height: 1.3;
                        }

                        .header-container {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                            border-bottom: 2px solid var(--darkGreen);
                            padding-bottom: 8px;
                            margin-bottom: 15px;
                        }

                        h1 {
                            font-family: "CO Headline", sans-serif;
                            color: var(--darkGreen);
                            font-size: 18px;
                            margin: 0;
                        }

                        .date-time {
                            font-size: 11px;
                            color: #555;
                        }

                        .question-block {
                            background-color: #ffffff;
                            border: solid 0.1rem #d4d4d4;
                            border-radius: 0.5rem;
                            padding: 8px 10px;
                            margin-bottom: 10px;
                            page-break-inside: avoid;
                        }

                        .q-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-family: "CO Headline", sans-serif;
                            font-size: 13px;
                            color: var(--darkGreen);
                            border-bottom: 1px solid #eee;
                            padding-bottom: 4px;
                            margin-bottom: 8px;
                        }

                        .q-meta {
                            display: flex;
                            gap: 15px;
                            font-family: 'Open Sans', sans-serif;
                            font-size: 11px;
                            font-weight: normal;
                        }

                        /* Beide statussen hebben nu dezelfde donkergroene kleur */
                        .status-actief, .status-inactief { 
                            color: var(--darkGreen); 
                        }

                        .lang-section {
                            margin-bottom: 8px;
                        }

                        .lang-section:last-child {
                            margin-bottom: 0;
                        }

                        .question-text {
                            font-weight: 600;
                            margin-bottom: 4px;
                            display: flex;
                            align-items: flex-start;
                        }

                        .lang-label {
                            background-color: var(--bgColor);
                            color: var(--darkGreen);
                            font-weight: bold;
                            padding: 2px 5px;
                            border-radius: 4px;
                            margin-right: 8px;
                            font-size: 10px;
                            text-transform: uppercase;
                        }

                        .answers-list {
                            margin: 0 0 0 38px;
                            padding: 0;
                            list-style-type: none;
                        }

                        .answers-list li {
                            margin-bottom: 2px;
                        }

                        .correct-answer {
                            font-weight: bold;
                            color: var(--darkGreen);
                        }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <h1>Overzicht Quizvragen</h1>
                        <div class="date-time">Geëxporteerd op: ${datumTijd}</div>
                    </div>
            `;

            questions.forEach((q, index) => {
                const qNumber = q.questionId !== undefined ? q.questionId : index + 1;
                const difficulty = q.easyQuestion ? "Makkelijk" : "Moeilijk";
                
                // Tekst is aangepast naar 'Inactief'
                const status = q.enabled 
                    ? '<span class="status-actief">Actief</span>' 
                    : '<span class="status-inactief">Inactief</span>';
                
                htmlContent += `
                    <div class="question-block">
                        <div class="q-header">
                            <span>Vraag ${qNumber}</span>
                            <div class="q-meta">
                                <span>Niveau: ${difficulty}</span>
                                <span>Status: ${status}</span>
                            </div>
                        </div>
                `;

                const talen = Object.keys(q).filter(key => typeof q[key] === 'object' && q[key].question);

                talen.sort((a, b) => {
                    if (a === 'nl') return -1;
                    if (b === 'nl') return 1;
                    return a.localeCompare(b);
                });

                talen.forEach(taal => {
                    const vertaling = q[taal];
                    
                    htmlContent += `
                        <div class="lang-section">
                            <div class="question-text">
                                <span class="lang-label">${taal}</span> 
                                <span>${vertaling.question}</span>
                            </div>
                            <ul class="answers-list">
                    `;

                    const letterLijst = ['A', 'B', 'C', 'D', 'E'];

                    if (vertaling.answers && Array.isArray(vertaling.answers)) {
                        vertaling.answers.forEach((antwoord, ansIndex) => {
                            const isCorrect = (q.correctAnswer === ansIndex);
                            const cssClass = isCorrect ? 'class="correct-answer"' : '';
                            const letter = letterLijst[ansIndex] || '-';
                            
                            // Haakjes verwijderd, enkel het vinkje overgebleven
                            const extraTekst = isCorrect ? ' <em>✓</em>' : '';
                            
                            htmlContent += `<li ${cssClass}>${letter}) ${antwoord}${extraTekst}</li>`;
                        });
                    }

                    htmlContent += `
                            </ul>
                        </div>
                    `;
                });

                htmlContent += `</div>`;
            });

            htmlContent += `
                </body>
                </html>
            `;

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(htmlContent);
            doc.close();

            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }, 500);
        })
        .catch(error => {
            console.error('Er is een fout opgetreden bij het ophalen van de vragen:', error);
        });
}

