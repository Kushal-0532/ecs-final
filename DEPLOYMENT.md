# Deployment & Installation Guide

## 🖥️ Raspberry Pi Setup

### Prerequisites
- Raspberry Pi 3/4+ with 2GB+ RAM
- Micro SD Card (16GB+ recommended)
- Power supply
- WiFi connectivity

### Step 1: Install Ubuntu/Raspbian

**Option A: Ubuntu Server (Recommended)**
```bash
# Download from https://ubuntu.com/download/raspberry-pi
# Flash to SD card using Balena Etcher or similar

# On first boot:
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git
```

**Option B: Raspberry Pi OS**
```bash
# Use Raspberry Pi Imager (official tool)
# Select: Raspberry Pi OS Lite (32-bit or 64-bit)
# Configure WiFi during setup
```

### Step 2: Install Node.js & npm

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install SQLite3

```bash
sudo apt-get install -y sqlite3 libsqlite3-dev
sqlite3 --version
```

### Step 4: Setup Project

```bash
# Clone or upload project
cd ~
git clone <your-repo-url> classroom
cd classroom/server

# Install dependencies
npm install

# Create directories
mkdir -p db uploads archives

# Set permissions
sudo chown -R pi:pi ~/classroom
```

### Step 5: Configure Environment

```bash
# Create .env file
nano .env

# Add:
PORT=3000
CLOUD_DB_URL=http://your-cloud-api.com/api
ENVIRONMENT=production
```

### Step 6: Test Server

```bash
# Run server
npm start

# Expected output:
# Classroom server running on http://0.0.0.0:3000
# Connected to SQLite database
# Database tables initialized
```

### Step 7: Setup as Service (Auto-start)

```bash
# Create systemd service file
sudo nano /etc/systemd/system/classroom.service

# Add content:
[Unit]
Description=Classroom Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/classroom/server
ExecStart=/usr/bin/node /home/pi/classroom/server/server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable classroom
sudo systemctl start classroom

# Check status
sudo systemctl status classroom

# View logs
sudo journalctl -u classroom -f
```

### Step 8: Setup Cloud Sync Service

```bash
# Create systemd service for sync
sudo nano /etc/systemd/system/classroom-sync.service

# Add content:
[Unit]
Description=Classroom Cloud Sync Service
After=network.target classroom.service
Requires=classroom.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/classroom/server
ExecStart=/usr/bin/node /home/pi/classroom/server/service.js
Restart=always
RestartSec=30
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable classroom-sync
sudo systemctl start classroom-sync
```

## 🌐 Network Configuration

### Find Raspberry Pi IP Address

```bash
# From Pi:
hostname -I
# or
ifconfig | grep inet

# From another device on network:
nmap -sn 192.168.1.0/24  # Adjust to your subnet
```

### Configure Static IP (Optional)

```bash
# Edit netplan config
sudo nano /etc/netplan/00-installer-config.yaml

# Add:
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

# Apply
sudo netplan apply
```

### Port Forwarding (For External Access)

```bash
# On router:
1. Access router admin panel (usually 192.168.1.1)
2. Find Port Forwarding section
3. Forward port 3000 (external) → Pi IP 3000 (internal)
4. Test: curl http://<your-public-ip>:3000/api/health
```

## 🔒 Firewall Configuration

```bash
# Install ufw
sudo apt-get install -y ufw

# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow classroom port
sudo ufw allow 3000/tcp

# Check rules
sudo ufw status
```

## 🔐 SSL/TLS Setup (HTTPS)

### Option 1: Self-Signed Certificate

```bash
# Generate certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/classroom.key \
  -out /etc/ssl/certs/classroom.crt

# Create HTTPS server (update server.js):
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/ssl/private/classroom.key'),
  cert: fs.readFileSync('/etc/ssl/certs/classroom.crt')
};

https.createServer(options, app).listen(443);
```

### Option 2: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 🚀 Docker Deployment (Alternative)

### Dockerfile
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Install sqlite3
RUN apk add --no-cache sqlite

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app
COPY . .

# Create directories
RUN mkdir -p db uploads archives

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  classroom:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./db:/app/db
      - ./uploads:/app/uploads
      - ./archives:/app/archives
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

### Run Docker
```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📱 Teacher App Deployment

### Local Development
```bash
cd teacher-app
npm install
npm start
# Access: http://localhost:3000
```

### Production Build
```bash
cd teacher-app
npm install
npm run build

# Serve static files
npx serve -s build -l 3001
# or deploy to Netlify/Vercel/GitHub Pages
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name teacher.yourdomain.com;

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

## 📱 Student App Deployment

### Build for Web
```bash
cd student-app
npm install
npm run build

# Deploy build/ folder to web server
# Update server URL in app before building
```

### Mobile App (React Native - Future)

```bash
# Install Expo CLI
npm install -g expo-cli

# Create mobile version
expo init student-app-mobile

# Build APK/IPA
eas build --platform android
eas build --platform ios
```

## ☁️ Cloud Backend Integration

### AWS Setup

```bash
# Install AWS CLI
sudo apt-get install -y awscli

# Configure
aws configure
# Enter: Access Key, Secret Key, Region, Output format

# Create S3 bucket for uploads
aws s3 mb s3://classroom-uploads

# Create RDS database
aws rds create-db-instance \
  --db-instance-identifier classroom \
  --db-instance-class db.t2.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password MyPassword123
```

### Environment Variables
```bash
# Add to .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
CLOUD_DB_URL=https://api.yourdomain.com/api
CLOUD_STORAGE_BUCKET=classroom-uploads
```

## 📊 Database Backup

### Automatic Backup Script

```bash
#!/bin/bash
# save as: backup.sh

BACKUP_DIR="/home/pi/backups"
DB_PATH="/home/pi/classroom/server/db/classroom.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/classroom_$TIMESTAMP.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz \
  /home/pi/classroom/server/uploads/

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
```

### Schedule Backup (Cron)
```bash
# Edit crontab
crontab -e

# Add (daily at 2 AM):
0 2 * * * /home/pi/backup.sh
```

## 🔍 Monitoring

### Disk Usage
```bash
df -h
du -sh ~/classroom
```

### Memory Usage
```bash
free -h
ps aux | grep node
```

### Service Status
```bash
# Check all services
systemctl status classroom
systemctl status classroom-sync

# Restart if needed
sudo systemctl restart classroom
```

### Log Analysis
```bash
# Server logs
sudo journalctl -u classroom -n 100

# Database size
ls -lh ~/classroom/server/db/

# Sync queue status
sqlite3 ~/classroom/server/db/classroom.db \
  "SELECT COUNT(*) FROM sync_queue WHERE synced = 0;"
```

## 🆘 Troubleshooting

### Server Won't Start

```bash
# Check port availability
sudo lsof -i :3000

# Kill process on port
sudo kill -9 <PID>

# Check node installation
which node
node -v
```

### Database Locked

```bash
# Restart service
sudo systemctl restart classroom

# Remove lock file
rm ~/classroom/server/db/classroom.db-journal

# Recover database
sqlite3 ~/classroom/server/db/classroom.db "PRAGMA integrity_check;"
```

### High Memory Usage

```bash
# Check running processes
ps aux --sort=-%mem | head -10

# Restart sync service
sudo systemctl restart classroom-sync

# Check for old logs
du -sh /var/log/journal/
```

### Connection Issues

```bash
# Test connectivity
ping 8.8.8.8

# Check WiFi
iwconfig

# Network status
ip addr show

# Firewall check
sudo ufw status
```

## 📈 Performance Tuning

### Increase File Limits
```bash
# Edit /etc/security/limits.conf
sudo nano /etc/security/limits.conf

# Add:
pi soft nofile 65536
pi hard nofile 65536

# Apply
ulimit -n 65536
```

### Optimize SQLite
```javascript
// In server.js, add to db initialization:
db.configure("busyTimeout", 5000);
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA synchronous = NORMAL");
```

### Node.js Tuning
```bash
# Increase memory for Node
node --max-old-space-size=512 server.js

# Or in systemd service:
Environment="NODE_OPTIONS=--max-old-space-size=512"
```

## 📞 Support & Maintenance

### Regular Maintenance
- [ ] Check disk space monthly
- [ ] Update packages quarterly: `sudo apt update && sudo apt upgrade`
- [ ] Review error logs weekly
- [ ] Backup database daily
- [ ] Monitor performance metrics

### Emergency Recovery
```bash
# Restart all services
sudo systemctl restart classroom classroom-sync

# Reset database
rm ~/classroom/server/db/classroom.db
npm start  # Will recreate tables

# Clear uploads
rm ~/classroom/server/uploads/*
```

---

**Last Updated**: October 29, 2025  
**Version**: 1.0.0
