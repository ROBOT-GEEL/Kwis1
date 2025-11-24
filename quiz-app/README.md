# BP-Tabloo-Quiz-App

An interactive quiz application with CMS (Content Management System), projector support, and real-time communication via Socket.IO. Made for visitor center Tabloo located in Dessel.This application is designed to run on Raspberry Pi 4 or Raspberry Pi 5 devices.

## Table of Contents

- [Hardware Requirements](#hardware-requirements)
- [Setting Up Raspberry Pi](#setting-up-raspberry-pi)
- [Installing Raspberry Pi OS Bookworm](#installing-raspberry-pi-os-bookworm)
- [Initial System Configuration](#initial-system-configuration)
- [System Dependencies](#system-dependencies)
- [Cloning the Repository](#cloning-the-repository)
- [Environment Setup](#environment-setup)
- [Installing Node.js Dependencies](#installing-nodejs-dependencies)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Hardware Requirements

- **Raspberry Pi 4** (4GB or 8GB RAM recommended) or **Raspberry Pi 5** (8GB recommended)
- **MicroSD Card** (32GB or larger, Class 10 or better, minimum 16GB)
- **Power Supply** (Official Raspberry Pi power supply: 5V 3A for Pi 4, 5V 5A for Pi 5)
- **Ethernet Cable** or WiFi adapter (built-in on Pi 4/5)
- **Monitor, Keyboard, and Mouse** (for initial setup, or use SSH)
- **HDMI Cable** (for display connection)

**Note:** Raspberry Pi 5 offers better performance and is recommended for smoother operation, but Pi 4 will work as well.

## Setting Up Raspberry Pi

### 1. Prepare the MicroSD Card

You'll need:
- A computer (Windows, macOS, or Linux)
- MicroSD card reader
- Raspberry Pi Imager software

### 2. Download Raspberry Pi Imager

1. Visit [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Download and install Raspberry Pi Imager for your operating system
3. Insert your MicroSD card into your computer

### 3. Flash Raspberry Pi OS

1. Open Raspberry Pi Imager
2. Click "Choose OS" and select:
   - **Raspberry Pi OS (other)** → **Raspberry Pi OS (64-bit)** (recommended for Pi 5)
   - Or **Raspberry Pi OS (32-bit)** for Pi 4 if you prefer
3. Click "Choose Storage" and select your MicroSD card
4. Click the gear icon (⚙️) to configure advanced options:
   - **Enable SSH**: Check this box
   - **Set username and password**: Create a user (e.g., `robotoo`) and password
   - **Configure wireless LAN**: Enter your WiFi credentials (optional, if using WiFi)
   - **Set locale settings**: Choose your timezone and keyboard layout
5. Click "Write" to flash the OS to the SD card
6. Wait for the process to complete (5-10 minutes)

## Installing Raspberry Pi OS Bookworm

Raspberry Pi OS Bookworm (Debian 12) is the latest stable version. The flashing process above installs it automatically.

### Post-Installation Setup

1. Insert the flashed MicroSD card into your Raspberry Pi
2. Connect the following:
   - Power supply (connect last)
   - HDMI cable to monitor
   - Keyboard and mouse (USB)
   - Ethernet cable (if not using WiFi)
3. Power on the Raspberry Pi
4. The system will boot into Raspberry Pi OS Desktop (if using desktop version)

### First Boot Configuration

If you didn't configure everything in the Imager:

1. Open Terminal or use SSH to connect:
   ```bash
   ssh robotoo@raspberrypi.local
   # Or use the IP address: ssh robotoo@192.168.1.xxx
   ```

2. Run the configuration tool (if needed):
   ```bash
   sudo raspi-config
   ```

   Configure:
   - **System Options** → **Wireless LAN** (if using WiFi)
   - **Interface Options** → **SSH** → Enable
   - **Localisation Options** → Set locale, timezone, keyboard
   - **Advanced Options** → Expand filesystem (recommended)

3. Exit and reboot:
   ```bash
   sudo reboot
   ```

## Initial System Configuration

### 1. Update the System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential updates
sudo apt full-upgrade -y

# Reboot to apply kernel updates
sudo reboot
```

### 2. Set Static IP Address (Optional but Recommended)

For easier access, you may want to set a static IP:

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the end (adjust for your network):
```
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Or for WiFi (wlan0):
```
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Save (Ctrl+O, Enter) and exit (Ctrl+X), then:
```bash
sudo systemctl restart dhcpcd
```

### 3. Enable SSH (if not already enabled)

```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 4. Check System Information

```bash
# Check Raspberry Pi model
cat /proc/device-tree/model

# Check OS version
cat /etc/os-release

# Check available memory
free -h

# Check disk space
df -h
```

## System Dependencies

Install required system packages:

```bash
# Update package list
sudo apt update

# Install essential build tools
sudo apt install -y build-essential curl wget git

# Install Python 3 and pip (for projector.py if needed)
sudo apt install -y python3 python3-pip python3-venv

# Install network utilities
sudo apt install -y net-tools iputils-ping

# Install additional useful tools
sudo apt install -y vim nano htop
```

## Cloning the Repository

1. Navigate to your desired directory (e.g., `/home/robotoo/Documents`):

```bash
cd ~/Documents
```

2. Clone the repository:

```bash
git clone <repository-url> quiz-app
```

Or if you have the repository locally, copy it to the desired location:

```bash
# Example: if you have the project on a USB drive
cp -r /media/usb/quiz-app ~/Documents/quiz-app
```

3. Navigate into the project directory:

```bash
cd quiz-app
```

## Environment Setup

### 1. Install Node.js

Raspberry Pi 4/5 uses ARM architecture (ARMv7 for 32-bit, ARM64 for 64-bit). Install Node.js using one of these methods:

#### Option A: Using NodeSource (Recommended)

For Raspberry Pi OS 64-bit (Bookworm):
```bash
# Install Node.js 20.x LTS (or 18.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

For 32-bit systems, use the ARMv7 version:
```bash
# Download Node.js binary for ARMv7
NODE_VERSION="20.11.0"
wget https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-armv7l.tar.xz
tar -xf node-v${NODE_VERSION}-linux-armv7l.tar.xz
sudo cp -r node-v${NODE_VERSION}-linux-armv7l/* /usr/local/
rm -rf node-v${NODE_VERSION}-linux-armv7l*

# Verify installation
node --version
npm --version
```

#### Option B: Using NVM (Node Version Manager)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20.x (or 18.x)
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version
npm --version
```

#### Option C: Using Package Manager (Simpler but may have older version)

```bash
# Install Node.js from Debian repositories
sudo apt install -y nodejs npm

# Verify installation
node --version
npm --version

# Note: This may install an older version. Consider upgrading npm:
sudo npm install -g npm@latest
```

### 2. Install MongoDB

#### Option A: MongoDB Community Edition (ARM64 - 64-bit OS)

For Raspberry Pi OS 64-bit:
```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository for Debian Bookworm
echo "deb [ arch=arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### Option B: Using MongoDB Atlas (Cloud - Recommended for Pi)

MongoDB Atlas is recommended for Raspberry Pi as it:
- Reduces local resource usage
- Provides better reliability
- Easier to manage

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your Raspberry Pi's IP address (or use 0.0.0.0/0 for development)
5. Get the connection string and update your `.env` file

#### Option C: Using Docker (Alternative)

If you prefer containerized MongoDB:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Pull and run MongoDB
sudo docker run -d \
  --name mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0

# Verify it's running
sudo docker ps
```

### 3. Create Environment File

Create a `.env` file in the `server` directory:

```bash
cd ~/Documents/quiz-app/server
nano .env
```

Add the following configuration:

```env
# Server Configuration
PORT=80
NODE_ENV=production

# MongoDB Configuration
# For local MongoDB:
ATLAS_URI=mongodb://localhost:27017
ATLAS_DBNAME=LocalRPIdb

# For MongoDB Atlas (cloud) - recommended for Raspberry Pi:
# ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/
# ATLAS_DBNAME=LocalRPIdb

# Projector Receiver Configuration
# IP address of the device running the projector receiver (another Pi or device)
PROJECTOR_RECEIVER_IP=192.168.50.77
PROJECTOR_RECEIVER_PORT=5050
```

**Important:**
- Update the `ATLAS_URI` with your actual MongoDB connection string
- Adjust the projector receiver IP/port if different
- For production, use port 80 (requires sudo) or use port 3000 and set up a reverse proxy

## Installing Node.js Dependencies

1. Navigate to the server directory:

```bash
cd ~/Documents/quiz-app/server
```

2. Install dependencies:

```bash
npm install
```

This will install all required packages listed in `package.json`:
- express
- socket.io
- mongodb
- cors
- dotenv
- winston
- And others...

## Database Setup

### Local MongoDB Setup

If using local MongoDB, the database will be created automatically when the application first connects. However, you may want to create initial collections:

```bash
# Connect to MongoDB shell
mongosh

# Switch to your database
use LocalRPIdb

# Create collections (optional - they'll be created automatically)
db.createCollection("questions")
db.createCollection("params")
db.createCollection("results")

# Exit MongoDB shell
exit
```

### MongoDB Atlas Setup

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your Orin Nano's IP address
5. Get the connection string and update your `.env` file

## Running the Application

### Development Mode

```bash
cd ~/Documents/quiz-app/server
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Production Mode

```bash
cd ~/Documents/quiz-app/server
npm start
```

Or run with Node.js directly:

```bash
node server.js
```

### Running as a Service (Systemd)

To run the application as a system service that starts on boot:

1. Create a service file:

```bash
sudo nano /etc/systemd/system/quiz-app.service
```

2. Add the following content (adjust paths and user as needed):

```ini
[Unit]
Description=Quiz Application Server
After=network.target mongod.service

[Service]
Type=simple
User=robotoo
WorkingDirectory=/home/robotoo/Documents/quiz-app/server
Environment=NODE_ENV=production
EnvironmentFile=/home/robotoo/Documents/quiz-app/server/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Note:** If using NVM, you may need to use the full path to node:
```bash
which node  # Find the node path
# Then use: ExecStart=/home/robotoo/.nvm/versions/node/v20.11.0/bin/node server.js
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable quiz-app
sudo systemctl start quiz-app
```

4. Check service status:

```bash
sudo systemctl status quiz-app
```

5. View logs:

```bash
# View recent logs
sudo journalctl -u quiz-app -n 50

# Follow logs in real-time
sudo journalctl -u quiz-app -f
```

### Running on Port 80 (Without Sudo)

If you want to run on port 80 without sudo, you can use a reverse proxy with nginx:

```bash
# Install nginx
sudo apt install -y nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/quiz-app
```

Add:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and start:
```bash
sudo ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Then run the app on port 3000 (change PORT in .env to 3000).

## Project Structure

```
quiz-app/
├── app/                    # Main quiz application frontend
│   ├── assets/            # Images, GIFs, and other assets
│   ├── js/                # JavaScript files
│   │   ├── quiz.js        # Main quiz logic
│   │   ├── app.js         # Application initialization
│   │   └── ...
│   ├── index.html         # Main quiz interface
│   └── style.css          # Styling
│
├── app-projector/          # Projector display frontend
│   ├── app.js             # Projector display logic
│   ├── index.html         # Projector interface
│   └── projector.css      # Projector styling
│
├── Cms/                    # Content Management System
│   ├── js/                # CMS JavaScript files
│   └── index.html         # CMS interface
│
├── server/                 # Backend server
│   ├── config/            # Configuration files
│   │   ├── db.js          # Database connection
│   │   └── logger.js      # Logging configuration
│   ├── controllers/       # Request handlers
│   │   ├── cmsController.js
│   │   ├── quizController.js
│   │   └── grafiekenController.js
│   ├── routes/            # API routes
│   ├── sockets/          # Socket.IO handlers
│   ├── server.js         # Main server file
│   └── package.json      # Node.js dependencies
│
├── Settings/              # Settings interface
├── Grafieken/             # Charts/graphs interface
├── projector.py          # Python script for projector control (PJLink)
└── README.md             # This file
```

## Configuration

### Server Configuration

The server configuration is set in `server/server.js`. Key settings:

- **Port**: Default is 3000, or set via `PORT` environment variable (defaults to 80 in production)
- **Root Directory**: Currently hardcoded to `/home/robotoo/Documents/quiz-app` - **Important:** Update line 24 in `server/server.js` if your installation path differs:

```bash
# Edit server.js
nano ~/Documents/quiz-app/server/server.js

# Change line 24 from:
const ROOT_DIR = "/home/robotoo/Documents/quiz-app";

# To your actual path, e.g.:
const ROOT_DIR = "/home/pi/quiz-app";
```

### Projector Control

The application supports automatic projector wake/sleep:
- **Wake**: Sent when quiz starts (`socket.emit('projector-wake')`)
- **Sleep**: Sent when quiz finishes (`socket.emit('projector-sleep')`)

The projector commands are sent to a receiver (typically a Raspberry Pi) running a Python listener on port 5050.

### Socket.IO Events

The application uses Socket.IO for real-time communication:

- `projector-wake` - Wake projector
- `projector-sleep` - Put projector to sleep
- `projector-update-question` - Update question on projector
- `projector-start-countdown` - Start countdown timer
- `projector-display-answers` - Display answer results
- `quiz-finished` - Quiz completion event
- And more...

## Accessing the Application

Once the server is running, access the application via:

- **Main Quiz Interface**: `http://<raspberry-pi-ip>/`
- **Projector Display**: `http://<raspberry-pi-ip>/projector`
- **CMS Interface**: `http://<raspberry-pi-ip>/cms`
- **Settings**: `http://<raspberry-pi-ip>/settings`
- **Charts/Grafieken**: `http://<raspberry-pi-ip>/grafieken`

Replace `<raspberry-pi-ip>` with your Raspberry Pi's IP address (e.g., `192.168.1.100`).

To find your Raspberry Pi's IP address:
```bash
# Using hostname
hostname -I

# Or using ip command
ip addr show

# Or check router's DHCP client list
```

## Troubleshooting

### Server Won't Start

1. **Check MongoDB connection:**
   ```bash
   # For system MongoDB
   sudo systemctl status mongod
   mongosh --eval "db.version()"

   # For Docker MongoDB
   sudo docker ps | grep mongo
   sudo docker exec -it mongodb mongosh --eval "db.version()"
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be 16.x or higher (18.x or 20.x recommended)
   npm --version
   ```

3. **Check port availability:**
   ```bash
   # Check if port 80 is in use
   sudo netstat -tulpn | grep :80
   # Or
   sudo ss -tulpn | grep :80

   # If port is in use, change PORT in .env file to 3000
   ```

4. **Check logs:**
   ```bash
   # Application logs
   tail -f ~/Documents/quiz-app/server/error.log

   # System logs (if running as service)
   sudo journalctl -u quiz-app -n 50

   # Check for errors
   sudo journalctl -u quiz-app -p err
   ```

5. **Check disk space:**
   ```bash
   df -h
   # Raspberry Pi can run out of space easily
   ```

### MongoDB Connection Issues

1. **Verify MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Check MongoDB connection string in `.env`:**
   - For local: `mongodb://localhost:27017`
   - For Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/`

3. **Test connection:**
   ```bash
   mongosh "mongodb://localhost:27017"
   ```

### Projector Commands Not Working

1. **Verify projector receiver is running** on the specified IP and port
2. **Check network connectivity:**
   ```bash
   ping 192.168.50.77  # Replace with your receiver IP
   telnet 192.168.50.77 5050  # Test port connectivity
   ```

3. **Check environment variables:**
   ```bash
   cat ~/Documents/quiz-app/server/.env | grep PROJECTOR
   ```

### Permission Issues

If you encounter permission errors:

```bash
# Make sure you own the project directory
sudo chown -R $USER:$USER ~/Documents/quiz-app

# If running on port 80, you may need sudo or use a port > 1024
# Or set up nginx reverse proxy (see above)
```

### Performance Optimization

For better performance on Raspberry Pi:

1. **Overclock (Optional - Pi 4/5):**
   ```bash
   sudo nano /boot/firmware/config.txt
   # Add (for Pi 4):
   # over_voltage=2
   # arm_freq=2000
   # gpu_freq=750

   # For Pi 5, use:
   # arm_freq=2800
   # gpu_freq=900

   sudo reboot
   ```

2. **Increase swap space (if needed):**
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # Change CONF_SWAPSIZE=100 to CONF_SWAPSIZE=2048
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

3. **Monitor system resources:**
   ```bash
   # CPU and memory
   htop

   # Temperature (important for Pi)
   vcgencmd measure_temp

   # CPU frequency
   vcgencmd measure_clock arm

   # Throttling status
   vcgencmd get_throttled
   ```

4. **Reduce GPU memory split (if not using desktop):**
   ```bash
   sudo raspi-config
   # Advanced Options → Memory Split → Set to 16 or 32
   ```

### Temperature Management

Raspberry Pi can throttle if it gets too hot:

```bash
# Check current temperature
vcgencmd measure_temp

# Monitor temperature continuously
watch -n 1 vcgencmd measure_temp

# If overheating, consider:
# - Adding a heatsink
# - Using a fan
# - Reducing CPU load
```

## Additional Resources

- [Raspberry Pi Official Documentation](https://www.raspberrypi.com/documentation/)
- [Raspberry Pi OS Bookworm Release Notes](https://www.raspberrypi.com/news/raspberry-pi-os-bookworm-release-notes/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Raspberry Pi Performance Tuning](https://www.raspberrypi.com/documentation/computers/configuration.html#performance-options)

## License

MIT License - See LICENSE file for details

## Authors

- Quinten (Original Author)

---

**Note:** This application is designed for the BP Tabloo project. For questions or support, please contact the development team.

## Raspberry Pi Specific Notes

- **Raspberry Pi 5** is recommended for better performance, but **Raspberry Pi 4** works well too
- Ensure adequate cooling (heatsink/fan) especially if overclocking
- Use a quality power supply to avoid throttling
- Consider using a fast MicroSD card (Class 10, A2 rating) or USB SSD for better I/O performance
- Monitor temperature during operation to prevent throttling
- For production use, consider using MongoDB Atlas (cloud) to reduce local resource usage
