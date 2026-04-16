#!/bin/bash

# ==============================================================================
# TEACHER FULL STACK — UNIFIED DEPLOYMENT SCRIPT
# ==============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# What this script does:
#   1. Checks all required system dependencies
#   2. Validates port availability
#   3. Validates .env files are configured
#   4. Creates required directories
#   5. Builds and starts all Docker containers
#   6. Waits for PostgreSQL to be healthy
#   7. Runs Prisma DB schema sync
#   8. Prints live service URLs
# ==============================================================================

set -e  # Exit immediately on any error

# ─── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helper Functions ─────────────────────────────────────────────────────────
log_step()    { echo -e "\n${YELLOW}${BOLD}[$1] $2${NC}"; }
log_ok()      { echo -e "  ${GREEN}✔ $1${NC}"; }
log_warn()    { echo -e "  ${YELLOW}⚠ $1${NC}"; }
log_error()   { echo -e "  ${RED}✖ $1${NC}"; }
log_info()    { echo -e "  ${BLUE}→ $1${NC}"; }

echo -e "${BLUE}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║     TEACHER PLATFORM — PRODUCTION DEPLOYMENT         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Ensure we run from the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
log_info "Working directory: $SCRIPT_DIR"

# ─── STEP 1: DEPENDENCY CHECKS ────────────────────────────────────────────────
log_step "1/6" "Checking system dependencies..."

check_dep() {
    if ! command -v "$1" &>/dev/null; then
        log_error "$1 is NOT installed. Please install it before rerunning."
        exit 1
    fi
    log_ok "$1 is installed ($(command -v "$1"))"
}

check_dep "git"
check_dep "docker"

# Handle both old 'docker-compose' and new 'docker compose' plugin
if command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    log_error "Neither 'docker-compose' nor 'docker compose' plugin found. Please install Docker Compose."
    exit 1
fi
log_ok "Docker Compose found as: $COMPOSE_CMD"

# ─── STEP 2: PORT AVAILABILITY CHECK ─────────────────────────────────────────
log_step "2/6" "Checking if required ports are available..."

check_port() {
    local port=$1
    if ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port" || \
       lsof -i ":$port" -sTCP:LISTEN -t &>/dev/null 2>&1; then
        log_warn "Port $port is already in use — another process may conflict."
    else
        log_ok "Port $port is free."
    fi
}

check_port 3000   # Backend API
check_port 3001   # Teacher/Admin Portal
check_port 3002   # Student Portal
check_port 5432   # PostgreSQL
check_port 8000   # AI RAG Engine

# ─── STEP 3: ENV FILE VALIDATION ─────────────────────────────────────────────
log_step "3/6" "Validating environment configuration..."

validate_env() {
    local service=$1
    local required_var=$2
    local env_path="./$service/.env"
    local example_path="./$service/.env.example"

    if [ ! -f "$env_path" ]; then
        if [ -f "$example_path" ]; then
            log_warn "No $env_path found. Copying from template. EDIT IT BEFORE PRODUCTION!"
            cp "$example_path" "$env_path"
        else
            log_error "Missing $env_path and no template found. Create it manually."
            exit 1
        fi
    fi

    # Check that required key is actually set (not empty)
    if [ -n "$required_var" ]; then
        if ! grep -qE "^${required_var}=.+" "$env_path"; then
            log_error "$env_path is missing or has empty value for: $required_var"
            log_error "Please open $env_path and fill in your API credentials before deploying."
            exit 1
        fi
    fi

    log_ok "$env_path is valid."
}

validate_env "backend" "JWT_SECRET"
validate_env "backend" "FIREBASE_PROJECT_ID"
validate_env "ai"      "GEMINI_API_KEY"

# ─── STEP 4: CREATE REQUIRED DIRECTORIES ─────────────────────────────────────
log_step "4/6" "Ensuring required directories exist..."

mkdir -p ./backend/uploads
mkdir -p ./ai/chroma_db
log_ok "backend/uploads created"
log_ok "ai/chroma_db created"

# ─── STEP 5: DOCKER BUILD & START ────────────────────────────────────────────
log_step "5/6" "Building and starting all Docker containers..."
log_info "This may take 5–15 minutes on first run (images are cached after that)."

# Gracefully stop any existing running containers
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# Pull latest base images to avoid stale caches on server
$COMPOSE_CMD pull db 2>/dev/null || true

# Build all services and start in detached mode
$COMPOSE_CMD up -d --build

log_ok "All containers started in background."

# ─── STEP 6: DATABASE SCHEMA SYNC ────────────────────────────────────────────
log_step "6/6" "Waiting for PostgreSQL and syncing Prisma schema..."

# Wait for PostgreSQL to become healthy (up to 60s)
echo -n "  Waiting for database"
for i in $(seq 1 24); do
    if $COMPOSE_CMD exec -T db pg_isready -U admin -d teacher_db &>/dev/null; then
        echo ""
        log_ok "PostgreSQL is healthy."
        break
    fi
    echo -n "."
    sleep 2.5
    if [ "$i" -eq 24 ]; then
        echo ""
        log_error "PostgreSQL did not become healthy in 60 seconds. Check logs:"
        log_info "  $COMPOSE_CMD logs db"
        exit 1
    fi
done

# Give backend a moment to boot up
sleep 3

# Run Prisma generate + db push inside backend container
log_info "Applying Prisma schema to database..."
$COMPOSE_CMD exec -T backend npx prisma generate
$COMPOSE_CMD exec -T backend npx prisma db push --accept-data-loss
log_ok "Database schema is up to date."

# ─── DONE ────────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║      DEPLOYMENT COMPLETE — SYSTEM IS LIVE! 🚀        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BOLD}Your platform is accessible at:${NC}"
echo -e "  ${GREEN}➜ Backend API${NC}        http://YOUR_SERVER_IP:3000/api"
echo -e "  ${GREEN}➜ API Docs (Swagger)${NC} http://YOUR_SERVER_IP:3000/api/docs"
echo -e "  ${GREEN}➜ Teacher Portal${NC}     http://YOUR_SERVER_IP:3001"
echo -e "  ${GREEN}➜ Student Portal${NC}     http://YOUR_SERVER_IP:3002"
echo -e "  ${GREEN}➜ AI RAG Engine${NC}      http://YOUR_SERVER_IP:8000"

echo -e "\n${BOLD}Useful management commands:${NC}"
echo -e "  ${BLUE}View all logs:${NC}        $COMPOSE_CMD logs -f"
echo -e "  ${BLUE}View backend logs:${NC}    $COMPOSE_CMD logs -f backend"
echo -e "  ${BLUE}View AI logs:${NC}         $COMPOSE_CMD logs -f ai"
echo -e "  ${BLUE}Stop all services:${NC}    $COMPOSE_CMD down"
echo -e "  ${BLUE}Restart a service:${NC}    $COMPOSE_CMD restart backend"
echo -e "  ${BLUE}Check container status:${NC} docker ps"
echo ""
