/*
 * Combined script for handling both pie charts (Chart.js) and time series (ApexCharts).
 * Handles fetching data from the backend and rendering the appropriate visualizations.
 */

// Colors used in the pie charts
const barColors = [
    "#5b9bd5", // blue
    "#70ad47", // green
    "#d49f00"  // yellow
];

let timechart = null;

// ============================================================================
// Initialization & Data Fetching (Pie Charts)
// ============================================================================

window.addEventListener('load', function () {
    // Parse URL parameters (format: ?bezocht=x&enable=x)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Get parameters and convert to boolean (null if not defined)
    const bezocht = JSON.parse(urlParams.get('bezocht'));
    const enable = JSON.parse(urlParams.get('enable'));
    
    console.log("Parameters - bezocht:", bezocht, "enable:", enable);

    // Generate specific text based on selected filters
    const enableString = enable === true ? "actieve" : enable === false ? "gearchiveerde" : "";
    const bezochtString = bezocht === true ? "bezoekers die de expo al hebben gedaan" : bezocht === false ? "bezoekers die de expo nog niet hebben gedaan" : "";
    const filterTextEl = document.getElementById("filterText");
    
    if (enable !== null && bezocht !== null) {
        filterTextEl.textContent = `Filter: ${enableString} vragen voor ${bezochtString}`;
    } else if (enable !== null) {
        filterTextEl.textContent = `Filter: alleen ${enableString} vragen`;
    } else if (bezocht !== null) {
        filterTextEl.textContent = `Filter: vragen voor ${bezochtString}`;
    } else {
        filterTextEl.textContent = "Filter: alle vragen";
    }
    
    // Fetch data using the filter parameters
    fetchResults({ "bezocht": bezocht, "enable": enable });
});

/*
 * Fetches the overall quiz results from the backend for the pie charts.
 */
async function fetchResults(config) {
    try {
        const response = await fetch("/grafieken/get-results", {
            method: "POST",
            body: JSON.stringify({
                userId: 1,
                title: "Quiz results",
                config: config,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

        if (response.status !== 200) {
            throw new Error(`Error getting quiz results: ${response.status}`);
        }

        const data = await response.json();
        console.log("Quiz results fetch successful: ", data);

        // Render charts if data exists, otherwise show error
        if (data.length > 0) {
            data.forEach(addGraphs);
        } else {
            const grid = document.getElementById("divGrafieken");
            grid.innerHTML = "<h3 style='color:var(--dangerColor); width: 100%; text-align: center;'>Geen resultaten gevonden voor deze filterinstellingen.</h3>";
        }
    } catch (error) {
        console.error("Failed to fetch pie chart data:", error);
    }
}

/*
 * Prepares data for a specific question and triggers the pie chart creation.
 */
function addGraphs(value) {
    // Calculate the total number of answers
    let totalAnswers = value.sumResults.reduce((a, b) => a + b, 0);
    
    // Scale the results to percentages (1 decimal)
    let scaledResults = value.sumResults.map(item => ((item / totalAnswers) * 100).toFixed(1));

    // Determine titles and labels (Fallback to defaults if Dutch info is missing)
    if (value.nl !== undefined) {
        addPieChart(String(value._id), value.nl.answers, scaledResults, value.nl.question, totalAnswers, true);
    } else {
        addPieChart(String(value._id), ["A", "B", "C"], value.sumResults, "Unknown", totalAnswers, true);
    }
}

// ============================================================================
// Chart Generation (Pie Charts)
// ============================================================================

/*
 * Generates the Chart.js pie chart and builds the custom legend card.
 */
function addPieChart(name, xValues, yValues, title, total, showLegend) {
    // Create card container
    let cardDiv = document.createElement('div');
    cardDiv.className = 'chart-card';

    // 1. ADD THE HTML TITLE FIRST
    // This allows natural text wrapping over 2 lines without squishing the chart
    let titleEl = document.createElement('h3');
    titleEl.className = 'chart-title';
    titleEl.textContent = title;
    cardDiv.appendChild(titleEl);

    // 2. CREATE CANVAS CONTAINER
    let canvasContainer = document.createElement('div');
    canvasContainer.className = 'pieChart-container';

    let canv = document.createElement('canvas');
    canv.id = name;
    
    canvasContainer.appendChild(canv);
    cardDiv.appendChild(canvasContainer);
    document.getElementById('divGrafieken').appendChild(cardDiv);
    
    // Initialize Chart.js
    let pieChart = new Chart(canv, {
        type: "pie",
        data: {
            labels: xValues,
            datasets: [{
                backgroundColor: barColors,
                data: yValues,
            }]
        },
        options: {
            plugins: {
                labels: { fontColor: '#FFFFFF' }
            }, 
            legend: {
                display: false
            },
            title: {
                display: false // Disabled here, handled by the HTML title above
            },
            maintainAspectRatio: false,
            responsive: true
        }
    });

    // Generate Custom Legend if required
    if (showLegend) {
        let legendDiv = document.createElement('div');
        legendDiv.className = 'chart-legend';
        legendDiv.innerHTML = pieChart.generateLegend();

        // Style the generated legend items
        let ul = legendDiv.querySelector('ul');
        if(ul) {
            let liElements = ul.querySelectorAll('li');
            for (let i = 0; i < liElements.length; i++) {
                let coloredSpan = document.createElement('span');
                coloredSpan.style.display = 'inline-block';
                coloredSpan.style.width = '20px';
                coloredSpan.style.height = '20px';
                coloredSpan.style.borderRadius = '3px';
                coloredSpan.style.backgroundColor = barColors[i];
                
                liElements[i].insertBefore(coloredSpan, liElements[i].firstChild);
            }
            
            // Append Total Answers count
            let totalLi = document.createElement('li');
            totalLi.innerHTML = `<strong>Total answers:</strong> ${total}`;
            totalLi.style.marginTop = "0.5rem";
            ul.appendChild(totalLi);
        }

        // Add button to open time series
        let button = document.createElement('button');
        button.className = 'btn-primary chart-action-btn';
        button.innerHTML = '<span class="btn-text">View Timeline</span>';
        button.onclick = function() {
            showTimeSeries(name); 
        };
        
        legendDiv.appendChild(button);
        cardDiv.appendChild(legendDiv);
    }
}

// ============================================================================
// Time Series (ApexCharts & Modal Logic)
// ============================================================================

/*
 * Opens the modal and fetches data for the time series.
 */
function showTimeSeries(name) {
    console.log("Displaying time series for question ID: " + name);

    const overlay = document.getElementById("grapgoverlay");
    const modal = document.getElementById("graphmodal");
    const closeBtn = document.getElementById("closeModalBtn");

    // Display modal
    overlay.style.display = "block";
    modal.style.display = "block";

    // Fetch the time series data
    fetchTimeResults(name);

    // Event listeners to close the modal
    const closeModal = function() {
        modal.style.display = "none";
        overlay.style.display = "none";
        if (timechart) {
            timechart.destroy();
            timechart = null;
        }
        document.getElementById('modalContent').innerHTML = ""; // Clear container
    };

    overlay.onclick = closeModal;
    closeBtn.onclick = closeModal;
}

/*
 * Fetches time series data from the backend.
 */
async function fetchTimeResults(id) {
    try {
        const response = await fetch("/grafieken/get-timeseries", {
            method: "POST",
            body: JSON.stringify({
                userId: 1,
                title: "Quiz time results",
                questionId: id
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

        if (response.status !== 200) {
            throw new Error(`Error getting time series results: ${response.status}`);
        }

        const data = await response.json();
        console.log("Time series fetch successful: ", data);

        addTimeline(data);
    } catch (error) {
        console.error("Failed to fetch time series data:", error);
    }
}

/*
 * Renders the ApexCharts area graph inside the modal.
 */
function addTimeline(data) {
    const timelineContainer = document.getElementById('modalContent');
    
    let options = {
        series: [
            { name: data.info.nl.answers[0], data: data.results.A },
            { name: data.info.nl.answers[1], data: data.results.B },
            { name: data.info.nl.answers[2], data: data.results.C }
        ],
        chart: {
            type: 'area',
            stacked: false,
            width: '100%',
            height: '100%',
            zoom: {
                type: 'x',
                enabled: true,
                autoScaleYaxis: true
            },
            toolbar: {
                autoSelected: 'zoom',
                show: true,
                tools: { download: true },
                export: {
                    csv: { filename: data.info.nl.question },
                    png: { filename: data.info.nl.question },
                    svg: { filename: data.info.nl.question }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        markers: {
            size: 5
        },
        title: {
            text: data.info.nl.question,
            align: 'left',
            style: {
                fontSize: '18px',
                fontFamily: 'Open Sans, sans-serif',
                color: '#005144'
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0,
                stops: [0, 90, 100]
            }
        },
        yaxis: {
            labels: {
                formatter: function (val) { return val; }
            },
            title: {
                text: 'Number of answers'
            }
        },
        xaxis: {
            type: 'datetime',
            tooltip: { enabled: false }
        },
        tooltip: {
            shared: true,
            y: {
                formatter: function (val) { return val; }
            }
        },
        export: {
            csv: {
                columnDelimiter: ',',
                headerCategory: 'category',
                headerValue: 'value',
                dateFormatter(timestamp) {
                    return new Date(timestamp).toDateString();
                }
            }
        }
    };

    timechart = new ApexCharts(timelineContainer, options);
    timechart.render();
}