import os
import time
import socketio
from gpiozero import Button
from signal import pause

# Force lgpio for modern Raspberry Pi OS compatibility
os.environ['GPIOZERO_PIN_FACTORY'] = 'lgpio'

# Setup Socket.IO client with explicit reconnection parameters
sio = socketio.Client(
    reconnection=True, 
    reconnection_attempts=0, # 0 means infinite retries
    reconnection_delay=2, 
    reconnection_delay_max=10
)

SERVER_URL = "http://localhost:80" 

def handle_button_press():
    if sio.connected:
        try:
            sio.emit('manual-screen-toggle')
        except Exception:
            # Ignore emit errors (e.g., brief network hiccup)
            pass

# Initialize GPIO
try:
    button = Button(21)
    button.when_pressed = handle_button_press
except Exception:
    # Exit if the hardware pin is completely unavailable
    exit(1)

def connect_with_retry():
    # Keep trying to connect indefinitely
    while True:
        try:
            if not sio.connected:
                sio.connect(SERVER_URL)
                break
        except Exception:
            # Wait 5 seconds before trying again
            time.sleep(5)

if __name__ == '__main__':
    try:
        connect_with_retry()
        pause()
    except Exception:
        pass
    finally:
        if sio.connected:
            sio.disconnect()