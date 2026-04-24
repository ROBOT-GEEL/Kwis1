import socketio
from gpiozero import Button
from signal import pause

# Setup Socket.IO client
sio = socketio.Client()

SERVER_URL = "http://localhost:80" 

def handle_button_press():
    print("Button pressed!")
    
    # Tell the server to toggle the screen
    if sio.connected:
        sio.emit('manual-screen-toggle')
    else:
        print("Warning: Not connected to server, timer not reset.")

# GPIO Setup
button = Button(21)
button.when_pressed = handle_button_press

try:
    # Connect to the server
    sio.connect(SERVER_URL)
    print("Service started. Waiting for button press on GPIO 21...")
    pause()
except Exception as e:
    print(f"Error: {e}")