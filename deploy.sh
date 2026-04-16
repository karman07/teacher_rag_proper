#!/bin/bash

# ==============================================================================
# TEACHER FULL STACK — UNIFIED DEPLOYMENT SCRIPT
# ==============================================================================
# This script handles:
# 1. Dependency Checks (Git, Docker, Compose)
# 2. Project Setup & Environment Configuration
# 3. Docker Build & Orchestration
# 4. Database Schema Sync (Prisma)
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# --- COLORS FOR FEEDBACK ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   TEACHER PLATFORM - SERVER DEPLOYMENT ENGINE     ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. DEPENDENCY CHECK
echo -e "\n${YELLOW}[1/5] Verifying system dependencies...${NC}"

check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it on your server.${NC}"
        exit 1
    else
        echo -e "${GREEN}✔ $1 found.${NC}"
    fi
}

check_dependency "git"
check_dependency "docker"
check_dependency "docker-compose"

# 2. PORT AVAILABILITY CHECK
echo -e "\n${YELLOW}[2/5] Checking port availability...${NC}"
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Warning: Port $1 is already in use. Ensure no other apps are blocking it.${NC}"
    else
        echo -e "${GREEN}✔ Port $1 is free.${NC}"
    fi
}
check_port 3000
check_port 3001
check_port 3002
check_port 8000

# 3. ENVIRONMENT SYNC
echo -e "\n${YELLOW}[3/5] Synchronizing configuration env files...${NC}"

setup_env() {
    local service=$1
    if [ ! -f "./$service/.env" ]; then
        if [ -f "./$service/.env.example" ]; then
            echo -e "${BLUE}Creating $service/.env from template...${NC}"
            cp "./$service/.env.example" "./$service/.env"
        else
            echo -e "${RED}Warning: No .env or .env.example found for $service.${NC}"
        fi
    else
        echo -e "${GREEN}✔ ./$service/.env exists.${NC}"
    fi
}

setup_env "ai"
setup_env "backend"

# 4. DOCKER BUILD & DEPLOY
echo -e "\n${YELLOW}[4/5] Building and launching containers...${NC}"
echo -e "${BLUE}This may take several minutes on the first run (caching builds)...${NC}"

# Shut down any previous instance to ensure a clean slate
docker-compose down || true

# Build and start in detached mode
docker-compose up -d --build

# 5. DATABASE AUTO-PUSH (PRISMA)
echo -e "\n${YELLOW}[5/5] Finalizing Database Schema...${NC}"
echo -e "${BLUE}Applying Prisma migrations to PostgreSQL container...${NC}"

# Allow some time for DB to fully accept connections
sleep 5

# Run prisma generate and db push inside the running backend container
docker exec teacher_backend npx prisma generate
docker exec teacher_backend npx prisma db push

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}   DEPLOYMENT SUCCESSFUL! SYSTEM IS LIVE.          ${NC}"
echo -e "${GREEN}====================================================${NC}"

echo -e "\n${BLUE}ACCESS YOUR PLATFORM:${NC}"
echo -e "➜  Backend API:      http://localhost:3000/api"
echo -e "➜  Admin Teacher:    http://localhost:3001"
echo -e "➜  Student Portal:   http://localhost:3002"
echo -e "➜  AI RAG Engine:    http://localhost:8000"

echo -e "\n${BLUE}USEFUL COMMANDS:${NC}"
echo -e "🗂  Check Logs:       docker-compose logs -f"
echo -e "🛑 Stop Platform:    docker-compose down"
echo -e "🔄 Restart All:      docker-compose restart"
echo -e "${BLUE}====================================================${NC}"
