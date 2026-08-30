#!/bin/bash
# =========================================================================
#  VitalSync Hospital Management System (HMS) - Unix/Linux/macOS Launcher
# =========================================================================

cd "$(dirname "$0")"

echo "========================================================================="
echo "       VitalSync Hospital Management System (HMS) Launcher"
echo "========================================================================="

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is NOT installed! Please install Node.js (v18+): https://nodejs.org/"
    exit 1
fi

# 2. Check Java
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java 17+ is NOT installed! Please install OpenJDK 17: https://adoptium.net/"
    exit 1
fi

# 3. Check and install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing frontend dependencies (npm install)..."
    npm install
fi

# Ensure mvnw has execute permissions
chmod +x ./backend/mvnw

# 4. Start Backend
echo "[2/3] Starting Spring Boot Backend on http://localhost:8080 ..."
(cd backend && ./mvnw spring-boot:run) &
BACKEND_PID=$!

# 5. Start Frontend
echo "[3/3] Starting Vite Frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================================================="
echo " [SUCCESS] VitalSync HMS is running!"
echo " Web UI: http://localhost:5173"
echo " Backend: http://localhost:8080"
echo " Credentials: admin / dr.chen / receptionist (Password: password123)"
echo " Press Ctrl+C to stop all servers."
echo "========================================================================="

# Wait and trap Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
