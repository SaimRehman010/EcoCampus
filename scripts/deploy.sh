#!/usr/bin/env bash

# ==============================================================================
# EcoCampus Docker Container Build & Production Deploy Launcher
# ==============================================================================

set -e

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}       🐳 EcoCampus Docker Build & Orchestration Launcher       ${NC}"
echo -e "${GREEN}================================================================${NC}"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not installed or not running.${NC}"
    exit 1
fi

# Ensure .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: Root .env not found. Creating default .env from .env.example...${NC}"
    cp .env.example .env
fi

echo -e "\n${BLUE}[1/3] Building multi-stage Docker images...${NC}"
docker compose build --parallel

echo -e "\n${BLUE}[2/3] Starting containerized microservices in background...${NC}"
docker compose up -d

echo -e "\n${BLUE}[3/3] Checking container health status...${NC}"
docker compose ps

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}       ✓ EcoCampus Microservices Successfully Deployed!         ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Access endpoints:"
echo -e "  • React Web Application:   http://localhost:3000"
echo -e "  • Express REST API:        http://localhost:5000/api/health"
echo -e "  • Python Resource Engine:  http://localhost:5001/api/health"
echo -e "  • Python AI Microservice:  http://localhost:5002/api/health"
echo -e "  • MongoDB Database:        mongodb://localhost:27017/ecocampus"
echo -e "\nTo view live logs:           docker compose logs -f"
echo -e "To tear down services:       docker compose down\n"
