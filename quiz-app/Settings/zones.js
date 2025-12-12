// Opslag voor de punten van de 3 zones
let zones = {
    1: [], // Array van {x, y} objecten
    2: [],
    3: []
};

let currentActiveZone = 1; // We beginnen bij zone 1
const maxPoints = 4; // Maximaal 4 punten per zone

// Kleuren voor de zones
const zoneColors = {
    1: 'rgba(255, 0, 0, 0.6)',   // Rood
    2: 'rgba(0, 0, 255, 0.6)',   // Blauw
    3: 'rgba(0, 255, 0, 0.6)'    // Groen
};

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const img = document.getElementById('cameraImage');
const CAMERA_ENDPOINT = "/foto";
const CAMERA_PORT = ":5000";

// Run the showImage function when the whole page is loaded in
document.addEventListener('DOMContentLoaded', (event) => {
    showImage();
});

// Fetches the ip of the Jetson from the server
async function getJetsonIp() {
    let response;
    try {
        response = await fetch('/cms/getJetsonIp');
    } catch {
        console.error("Network error while fetching the Jetson IP address");
        return null;
    }
    if (!response.ok) {
        console.error("Error fetching the Jetson IP address: " + response.status);
        return null;
    }
    const data = await response.json();
    return data;
}

// Shows the image taken by the Jetson
async function showImage() {
    if (img) {
        const JETSON_IP = await getJetsonIp();

        if (JETSON_IP) {
            img.src = `http://${JETSON_IP}${CAMERA_PORT}${CAMERA_ENDPOINT}`; // set the image source in the html
        } else {
            console.error("Kon IP-adres niet ophalen. Afbeelding wordt niet geladen.");
        }
    } else {
        console.error("Camera afbeelding element niet gevonden.");
    }
}

// Make sure that the drawing canvas is the same size as the image
function resizeCanvas() {
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    drawAllZones();
}

// When the window resizes, resize the canvas
window.addEventListener('resize', resizeCanvas);

// Add a point to the selected zone
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let currentPoints = zones[currentActiveZone];

    // If there are 4 points, start over
    if (currentPoints.length >= maxPoints) {
        zones[currentActiveZone] = [];
        currentPoints = zones[currentActiveZone];
    }

    // Add the point
    currentPoints.push({ x: x, y: y });

    // Draw everything again including the new point
    drawAllZones();
});

// Draw all the point and zones
function drawAllZones() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through the 3 zones
    for (let i = 1; i <= 3; i++) {
        const points = zones[i];
        if (points.length === 0) continue;

        ctx.beginPath();
        ctx.strokeStyle = zoneColors[i];
        ctx.fillStyle = zoneColors[i].replace('0.6', '0.2');
        ctx.lineWidth = 3;

        // Draw lines between points
        ctx.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++) {
            ctx.lineTo(points[j].x, points[j].y);
        }

        // If there are 4 points , close teh shape and fill it
        if (points.length === maxPoints) {
            ctx.closePath();
            ctx.fill();
        }

        ctx.stroke();

        // Draw the points
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
        });
    }
}

// Change the active zone when a button has been pressed
function selectZone(zoneNumber) {
    currentActiveZone = zoneNumber;
    updateButtons();
}

function updateButtons() {
    // Reset all the buttons
    document.querySelectorAll('.zone-btn').forEach(btn => btn.classList.remove('active'));
    // Activate the pressed button
    document.getElementById(`btn-zone-${currentActiveZone}`).classList.add('active');
}

function clearCurrentZone() {
    zones[currentActiveZone] = [];
    drawAllZones();
}

async function saveZones() {
    // 1. Validation: check if all the zones have been drawn
    let incompleteZones = [];

    for (let i = 1; i <= 3; i++) {
        // All the zones have to exist and have 4 points
        if (!zones[i] || zones[i].length < maxPoints) {
            incompleteZones.push("Zone " + i);
        }
    }

    if (incompleteZones.length > 0) {
        alert("Kan niet opslaan! Niet elke zone heeft 4 punten. Duid voor elke zone 4 punten aan en probeer het opnieuw.");
        return;
    }

    // 2. Prepare data: convert the coordinates from the canvas to the actual coordinates from te image
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const exportData = {};

    const zoneKeys = ["", "A", "B", "C"]; // Index 0 is empty, convert 'zone 1' to 'A'

    for (let i = 1; i <= 3; i++) {
        const key = zoneKeys[i];

        exportData[key] = zones[i].map(p => ({
            x: Math.max(0, Math.round(p.x * scaleX)),
            y: Math.max(0, Math.round(p.y * scaleY))
        }));
    }

    // 3. Export the data: send the data to the Jetson via the server
    console.log("Coördinaten zones:", exportData);

    fetch('/cms/saveZones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            coordinates: exportData
        })
    })
    .then(response => {
        if (response.ok) {
            console.log("New zones saved");
            return response.json();
        } else {
            throw new Error('Failed to save new zones');
        }
    })
    .then(data => {
        alert('De nieuwe zones zijn succesvol opgeslagen!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Er ging iets mis bij het opslaan.');
    });
}
