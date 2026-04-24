from gpiozero import Button
import subprocess
from signal import pause

# Use GPIO 17 (Physical pin 11)
# The Button class automatically handles the pull-up resistor
button = Button(17)

def wake_screen():
    print("Button pressed! Turning off screen...")
    # This command works for X11 sessions
    subprocess.run("DISPLAY=:0 xset s activate", shell=True)

# Link the function to the press event
button.when_pressed = wake_screen

print("Service started. Waiting for button press on GPIO 17...")
pause()