#!/usr/bin/env bash

# ==============================================================================
# EcoCampus Local Development Setup & Environment Validator
# ==============================================================================

set -e

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}       🌱 EcoCampus - Local Environment Setup & Installer       ${NC}"
echo -e "${GREEN}================================================================${NC}"

# 1. Verify Node.js Binary
echo -e "\n${BLUE}[1/5] Checking Node.js and NPM...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ Node.js found: ${NODE_VERSION} (NPM: ${NPM_VERSION})${NC}"
else
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js (v18+) to proceed.${NC}"
    exit 1
fi

# 2. Verify Python Binary
echo -e "\n${BLUE}[2/5] Checking Python 3...${NC}"
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "${RED}✗ Python is not installed. Please install Python 3.9+ to proceed.${NC}"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
echo -e "${GREEN}✓ Python found: ${PYTHON_VERSION}${NC}"

# 3. Verify Docker and Docker Compose (Optional for local dev)
echo -e "\n${BLUE}[3/5] Checking Docker & Docker Compose...${NC}"
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Docker found: ${DOCKER_VERSION}${NC}"
else
    echo -e "${YELLOW}! Docker is not installed or not in PATH (Required for containerized deployment).${NC}"
fi

# 4. Install Node.js Dependencies (Backend & Frontend)
echo -e "\n${BLUE}[4/5] Installing Node.js packages...${NC}"
echo "Installing Express backend dependencies..."
npm install --silent

echo "Installing React frontend dependencies..."
cd frontend
npm install --silent
cd ..
echo -e "${GREEN}✓ Node.js dependencies installed successfully.${NC}"

# 5. Set up Python Virtual Environments & Dependencies
echo -e "\n${BLUE}[5/5] Configuring Python microservices...${NC}"

# Python Resource Analyzer (Port 5001)
echo "Setting up python-service environment..."
cd python-service
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate || true
cd ..

# Python AI Service (Port 5002)
echo "Setting up ai-service environment..."
cd ai-service
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
fi
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate || true
cd ..

# Check .env files
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}! Created .env from .env.example. Please review your secrets.${NC}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}       ✓ EcoCampus Setup Complete! System Ready to Launch.       ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "To start all microservices locally in development mode:"
echo -e "  1. Express Backend:        npm run dev           (Port 5000)"
echo -e "  2. Resource Analyzer:      cd python-service && python app.py  (Port 5001)"
echo -e "  3. AI RAG & Agent Service: cd ai-service && python app.py      (Port 5002)"
echo -e "  4. React Frontend:         cd frontend && npm run dev          (Port 3000)"
echo -e "Or launch the full stack with Docker: ./scripts/deploy.sh\n"
