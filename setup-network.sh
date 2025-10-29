#!/bin/bash

# Classroom Management System - Network Setup Script
# This script helps configure the apps to connect to a Raspberry Pi server

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Classroom Management System - Network Setup               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get Raspberry Pi IP
read -p "Enter Raspberry Pi IP address (e.g., 192.168.1.100): " PI_IP

if [ -z "$PI_IP" ]; then
  echo "❌ Error: IP address cannot be empty"
  exit 1
fi

# Validate IP format (basic check)
if ! [[ $PI_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
  echo "❌ Error: Invalid IP address format"
  exit 1
fi

SERVER_URL="http://$PI_IP:3000"

echo ""
echo "✓ Configuring apps to connect to: $SERVER_URL"
echo ""

# Create .env.local for teacher-app
echo "Setting up teacher-app..."
if [ -d "teacher-app" ]; then
  echo "REACT_APP_SERVER_URL=$SERVER_URL" > teacher-app/.env.local
  echo "✓ Created teacher-app/.env.local"
else
  echo "⚠️  teacher-app directory not found, skipping"
fi

# Create .env.local for student-app
echo "Setting up student-app..."
if [ -d "student-app" ]; then
  echo "REACT_APP_SERVER_URL=$SERVER_URL" > student-app/.env.local
  echo "✓ Created student-app/.env.local"
else
  echo "⚠️  student-app directory not found, skipping"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ Network Configuration Complete!                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Start server on Raspberry Pi (in one terminal):"
echo "   ssh pi@$PI_IP"
echo "   cd ~/ecs-final/server"
echo "   npm start"
echo ""
echo "2️⃣  Start teacher app on your laptop (in another terminal):"
echo "   cd teacher-app"
echo "   npm install"
echo "   npm start"
echo ""
echo "3️⃣  Start student app on your laptop (in another terminal):"
echo "   cd student-app"
echo "   npm install"
echo "   npm start"
echo ""
echo "4️⃣  Test the connection:"
echo "   - Open both apps in browser"
echo "   - Start a class in teacher app"
echo "   - Join in student app"
echo ""
echo "✨ Configuration saved to:"
echo "   - teacher-app/.env.local"
echo "   - student-app/.env.local"
echo ""
echo "🔑 Server URL: $SERVER_URL"
echo ""
