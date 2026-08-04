// 1. Kleuren voor de grafieken definiëren
const chartDarkGreen = '#2e7d32'; 
const chartPastelGreen = '#c8e6c9'; 
const chartDarkRed = '#c62828';  
const chartPastelRed = '#ffcdd2';  

// 2. Data ophalen van de server
async function fetchQuizResults() {
  try {
    const response = await fetch('/statistieken/get-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) 
    });

    if (!response.ok) {
      throw new Error(`Netwerkfout: HTTP status ${response.status}`);
    }

    const data = await response.json();
    console.log("Opgehaalde quiz resultaten:", data);
    
    renderCharts(data);

  } catch (error) {
    console.error("Er is een fout opgetreden bij het ophalen van de resultaten:", error);
  }
}

// 3. Grafieken dynamisch genereren
function renderCharts(quizData) {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = ''; // Zorg dat de container leeg is

    quizData.forEach((item, index) => {
       
        const canvasId = `quizChart_${index}`;
        
        const pctVisited = item.totalVisited > 0 
            ? item.resultsVisited.map(val => Math.round((val / item.totalVisited) * 100))
            : [0, 0, 0];
            
        const pctNotVisited = item.totalNotVisited > 0 
            ? item.resultsNotVisited.map(val => Math.round((val / item.totalNotVisited) * 100))
            : [0, 0, 0];

        let bgVisited = [chartDarkRed, chartDarkRed, chartDarkRed];
        let bgNotVisited = [chartPastelRed, chartPastelRed, chartPastelRed];
        
        const answerA = item.question.answers[0] || "Antwoord A";
        const answerB = item.question.answers[1] || "Antwoord B";
        const answerC = item.question.answers[2] || "Antwoord C";

        const maxLen = 25;

        let labels = [
            wrapText(`${answerA}`, maxLen), 
            wrapText(`${answerB}`, maxLen), 
            wrapText(`${answerC}`, maxLen)
        ];

        if (item.correct !== "" && item.correct !== null) {
            bgVisited[item.correct] = chartDarkGreen;
            bgNotVisited[item.correct] = chartPastelGreen;
            
            const correctAnswerText = item.question.answers[item.correct] || "Correct antwoord";
            labels[item.correct] = wrapText(`${correctAnswerText}`, maxLen);
        }

        const statusLabel = item.enabledQuestion ? "Actieve vraag" : "Inactieve vraag";
        const difficultyLabel = item.easyQuestion ? "Makkelijke vraag" : "Moeilijke vraag";

        const dataStatus = item.enabledQuestion ? 'enabled' : 'disabled';
        const dataDifficulty = item.easyQuestion ? 'easy' : 'hard';

        const dataSearch = `${item.question.question || item.question} ${answerA} ${answerB} ${answerC}`.toLowerCase();
        
        const cardHTML = `
            <div class="card quiz-mini-card" data-status="${dataStatus}" data-difficulty="${dataDifficulty}" data-search="${dataSearch}">
                <h3 class="quiz-question-title">${item.question.question || item.question}</h3>
                
                <div class="totals-header">
                    <div class="header-left">
                        <div>Bezocht: <span class="bold">${item.totalVisited}</span></div>
                        <div>Niet-bezocht: <span class="bold">${item.totalNotVisited}</span></div>
                    </div>
                    <div class="header-right">
                        <div class="status-badge">${difficultyLabel}</div>
                        <div class="status-badge">${statusLabel}</div>
                    </div>
                </div>
                
                <div class="canvas-wrapper">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', cardHTML);
      
        const ctx = document.getElementById(canvasId).getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bezocht',
                        data: pctVisited, 
                        backgroundColor: bgVisited,
                        borderWidth: 0,
                        barPercentage: 0.9,
                        categoryPercentage: 0.8
                    },
                    {
                        label: 'Niet-bezocht',
                        data: pctNotVisited, 
                        backgroundColor: bgNotVisited,
                        borderWidth: 0,
                        barPercentage: 0.9,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                indexAxis: 'y', 
                responsive: true,
                maintainAspectRatio: false, 
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.x + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        max: 100, 
                        ticks: {
                            stepSize: 50, 
                            callback: function(value) { return value + '%'; }
                        },
                        grid: { color: '#e0e0e0' }
                    },
                    y: {
                        grid: { display: false }
                    }
                }
            }
        });
    });
}

// Hulpfunctie om lange teksten netjes af te breken over meerdere regels
function wrapText(text, maxLineLength) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length > maxLineLength) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    if (currentLine) lines.push(currentLine.trim());
    
    return lines;
}

/**
 * Filtert de statistieken op basis van tekst, status en moeilijkheid.
 */

function filterStats() {
    // 1. Lees de huidige waarden van alle filters uit
    let input = document.getElementById('statsSearchBar').value.toLowerCase();
    let statusFilter = document.getElementById('filterStatus').value;
    let difficultyFilter = document.getElementById('filterDifficulty').value;
    
    // 2. Pak alle gegenereerde kaarten in de container
    let statFrames = document.querySelectorAll('.quiz-mini-card');

    statFrames.forEach(function(frame) {
        // -- Check 1: Voldoet de tekst (vraag én antwoorden)? --
        let textToSearch = frame.getAttribute('data-search') || "";
        let matchesText = textToSearch.includes(input);

        // -- Check 2: Voldoet de status? --
        let itemStatus = frame.getAttribute('data-status');
        let matchesStatus = (statusFilter === "all") || (statusFilter === itemStatus);

        // -- Check 3: Voldoet de moeilijkheidsgraad? --
        let itemDifficulty = frame.getAttribute('data-difficulty');
        let matchesDifficulty = (difficultyFilter === "all") || (difficultyFilter === itemDifficulty);

        // Als het blok aan ALLE filters voldoet, laten we hem zien
        if (matchesText && matchesStatus && matchesDifficulty) {
            frame.style.display = ""; 
        } else {
            frame.style.display = "none"; 
        }
    });
}

fetchQuizResults();

