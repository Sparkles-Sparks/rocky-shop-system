#!/bin/bash

# Rocky Shop System Setup Script
# Compatible with Rocky 9.0, Ubuntu 20.04, 22.04, and 24.04+

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Run as regular user."
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect operating system"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Check Ubuntu version compatibility
if [[ "$OS" == *"Ubuntu"* ]]; then
    if [[ "$VER" == "24.04"* ]] || [[ "$VER" == "22.04"* ]] || [[ "$VER" == "20.04"* ]]; then
        print_status "Ubuntu $VER is supported"
    else
        print_warning "Ubuntu $VER may not be fully tested. Recommended versions: 20.04, 22.04, 24.04"
    fi
fi

# Update system packages
print_status "Updating system packages..."
if [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    sudo dnf update -y
    sudo dnf install -y dnf-utils device-mapper-persistent-data lvm2 curl git nano unzip
elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    sudo apt update -y
    sudo apt upgrade -y
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common git nano unzip python3 perl openssl
else
    print_error "Unsupported operating system"
    exit 1
fi

# Install Docker
print_status "Installing Docker..."
if [[ "$OS" == *"Rocky"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
    sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Updated Docker installation for Ubuntu 24.04+
    sudo apt update -y
    sudo apt install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key (modern method)
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository (modern method)
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt update -y
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# Start and enable Docker
print_status "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Restart Docker to ensure all components are loaded (Ubuntu 24.04 fix)
sudo systemctl restart docker

# Add user to docker group
print_status "Adding user to docker group..."
sudo usermod -aG docker $USER

# Check if user can access Docker without sudo
print_status "Checking Docker permissions..."
if ! docker version &> /dev/null; then
    print_warning "Docker permissions not active. You need to logout and login again for group changes to take effect."
    print_warning "Alternatively, you can run Docker commands with sudo for this session."
    echo ""
    echo "Choose an option:"
    echo "1) Logout and login (recommended for future use)"
    echo "2) Continue with sudo for this session"
    echo "3) Use 'newgrp docker' to activate group for this session"
    echo ""
    read -p "Enter your choice (1/2/3): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            print_status "Please logout and login again, then run this script to continue."
            exit 0
            ;;
        2)
            print_status "Using sudo for Docker commands in this session..."
            USE_SUDO_DOCKER=true
            ;;
        3)
            print_status "Activating docker group for this session..."
            exec newgrp docker << 'EOF'
                echo "Docker group activated. Please run the setup script again."
                exit 0
EOF
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
else
    print_status "Docker permissions are working correctly."
    USE_SUDO_DOCKER=false
fi

# Check if project directory exists
PROJECT_DIR="rocky-shop-system"
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Project directory '$PROJECT_DIR' already exists."
    read -p "Do you want to remove it and clone fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
        print_status "Removed existing project directory"
    else
        print_status "Using existing project directory"
        cd "$PROJECT_DIR"
    fi
fi

# Clone repository (if directory doesn't exist)
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Setting up project directory..."
    
    # Try different methods to get the source code (prioritize non-auth methods)
    if command -v wget &> /dev/null; then
        print_status "Using wget to download source code (no login required)..."
        mkdir -p "$PROJECT_DIR"
        wget https://github.com/Sparkles-Sparks/rocky-shop-system/archive/main.zip -O main.zip
        unzip main.zip -d .
        mv rocky-shop-system-main/* "$PROJECT_DIR/"
        mv rocky-shop-system-main/.* "$PROJECT_DIR/" 2>/dev/null || true
        rm -rf rocky-shop-system-main main.zip
    elif command -v curl &> /dev/null; then
        print_status "Using curl to download source code (no login required)..."
        mkdir -p "$PROJECT_DIR"
        curl -L https://github.com/Sparkles-Sparks/rocky-shop-system/archive/main.zip -o main.zip
        unzip main.zip -d .
        mv rocky-shop-system-main/* "$PROJECT_DIR/"
        mv rocky-shop-system-main/.* "$PROJECT_DIR/" 2>/dev/null || true
        rm -rf rocky-shop-system-main main.zip
    elif command -v git &> /dev/null; then
        print_status "Using Git to clone repository..."
        print_warning "Git may require authentication. Consider using wget or curl for anonymous downloads."
        git clone https://github.com/Sparkles-Sparks/rocky-shop-system.git "$PROJECT_DIR"
    else
        print_error "No download method available. Please install wget, curl, or git"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
fi

# Create environment file
print_status "Setting up environment configuration..."
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    print_status "Generated JWT secret: ${JWT_SECRET:0:10}..."
    
    # Use Python for reliable text replacement (most robust method)
    if command -v python3 &> /dev/null; then
        python3 -c "
import re
import sys
if len(sys.argv) < 2:
    print('Error: JWT secret not provided')
    exit(1)
jwt_secret = sys.argv[1]
with open('server/.env', 'r') as f:
    content = f.read()
content = re.sub(r'your-super-secret-jwt-key-change-this-in-production', jwt_secret, content)
with open('server/.env', 'w') as f:
    f.write(content)
print('JWT secret updated successfully')
" "$JWT_SECRET"
    # Use Perl as fallback (handles special characters well)
    elif command -v perl &> /dev/null; then
        perl -pi -e "s/your-super-secret-jwt-key-change-this-in-production/\$JWT_SECRET/g" server/.env
    # Use awk as final fallback
    else
        awk -v secret="$JWT_SECRET" '{gsub(/your-super-secret-jwt-key-change-this-in-production/, secret)}1' server/.env > server/.env.tmp && mv server/.env.tmp server/.env
    fi
    
    print_status "Environment file created with random JWT secret"
else
    print_warning "Environment file already exists"
fi

# Check Docker Compose availability and use appropriate command
DOCKER_COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Using Docker Compose command: $DOCKER_COMPOSE_CMD"

# Build Docker images
print_status "Building Docker images (this may take several minutes)..."
if [ "$USE_SUDO_DOCKER" = true ]; then
    sudo $DOCKER_COMPOSE_CMD build
else
    $DOCKER_COMPOSE_CMD build
fi

# Start services
print_status "Starting all services..."
if [ "$USE_SUDO_DOCKER" = true ]; then
    sudo $DOCKER_COMPOSE_CMD up -d
else
    $DOCKER_COMPOSE_CMD up -d
fi

# Wait for services to be ready
print_status "Waiting for services to initialize..."
sleep 30

# Check service status
print_status "Checking service status..."
if [ "$USE_SUDO_DOCKER" = true ]; then
    sudo $DOCKER_COMPOSE_CMD ps
else
    $DOCKER_COMPOSE_CMD ps
fi

# Display access information
print_status "Installation completed successfully!"
echo ""
echo -e "${GREEN}=== ACCESS INFORMATION ===${NC}"
echo -e "Frontend: ${YELLOW}http://localhost${NC}"
echo -e "Backend API: ${YELLOW}http://localhost:5001${NC}"
echo -e "Health Check: ${YELLOW}http://localhost:5001/api/health${NC}"
echo ""
echo -e "${GREEN}=== DEFAULT LOGIN ===${NC}"
echo -e "Email: ${YELLOW}admin@shop.com${NC}"
echo -e "Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${GREEN}=== MANAGEMENT COMMANDS ===${NC}"
echo -e "Stop: ${YELLOW}docker-compose down${NC}"
echo -e "Start: ${YELLOW}docker-compose up -d${NC}"
echo -e "Logs: ${YELLOW}docker-compose logs -f${NC}"
echo ""
print_warning "Please logout and login again to use Docker without sudo"
print_warning "Remember to change default passwords and configure SSL for production use"
