# Installation Guide for Rocky 9.0/Ubuntu Linux

## Prerequisites

### System Requirements

- Rocky 9.0 or Ubuntu 20.04, 22.04, 24.04+
- Minimum 4GB RAM
- 20GB available disk space
- Internet connection

### Required Software

- Docker & Docker Compose
- Git OR wget OR curl (for downloading the source code)

## Step 1: Install Docker and Docker Compose

### For Rocky 9.0/RHEL-based Systems

```bash
# Update system packages
sudo dnf update -y

# Install required dependencies
sudo dnf install -y dnf-utils device-mapper-persistent-data lvm2

# Add Docker repository
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker compose-plugin

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional but recommended)
sudo usermod -aG docker $USER
```

### For Ubuntu 24.04/22.04/20.04/Debian-based Systems

```bash
# Update system packages
sudo apt update -y

# Install required dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list and install Docker
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker compose-plugin

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional but recommended)
sudo usermod -aG docker $USER
```

## Step 2: Install Download Tools (Optional)

The setup script can download the source code using multiple methods. For automatic installation without authentication, install wget or curl:

### Option A: wget (Recommended - No authentication required)

#### Rocky 9.0/RHEL-based Systems (wget)

```bash
sudo dnf install -y wget unzip
```

#### Ubuntu 24.04/22.04/20.04/Debian-based Systems (wget)

```bash
sudo apt install -y wget unzip
```

### Option B: curl (Alternative - No authentication required)

#### Rocky 9.0/RHEL-based Systems (curl)

```bash
sudo dnf install -y curl unzip
```

#### Ubuntu 24.04/22.04/20.04/Debian-based Systems (curl)

```bash
sudo apt install -y curl unzip
```

### Option C: Git (Requires authentication for private repos)

#### Rocky 9.0/RHEL-based Systems (git)

```bash
sudo dnf install -y git
```

#### Ubuntu 24.04/22.04/20.04/Debian-based Systems (git)

```bash
sudo apt install -y git
```

**Note:** The automated setup script prioritizes wget and curl to avoid authentication prompts. Git is only used as a fallback.

## Step 3: Download the Source Code

### Option A: Using wget (Recommended - No authentication required)

```bash
# Navigate to your home directory or preferred location
cd ~

# Download the source code as zip file
wget https://github.com/YOUR_USERNAME/rocky-shop-system/archive/main.zip -O rocky-shop-system.zip

# Extract the archive
unzip rocky-shop-system.zip
mv rocky-shop-system-main rocky-shop-system
cd rocky-shop-system

# Clean up
rm ../rocky-shop-system.zip
```

### Option B: Using curl (Alternative - No authentication required)

```bash
# Navigate to your home directory or preferred location
cd ~

# Download the source code as zip file
curl -L https://github.com/YOUR_USERNAME/rocky-shop-system/archive/main.zip -o rocky-shop-system.zip

# Extract the archive
unzip rocky-shop-system.zip
mv rocky-shop-system-main rocky-shop-system
cd rocky-shop-system

# Clean up
rm ../rocky-shop-system.zip
```

### Option C: Using Git (Requires authentication for private repos)

```bash
# Navigate to your home directory or preferred location
cd ~

# Clone the shop system repository
git clone https://github.com/YOUR_USERNAME/rocky-shop-system.git rocky-shop-system

# Navigate to the project directory
cd rocky-shop-system
```

**Recommended:** Use wget or curl methods for anonymous downloads without authentication prompts.

## Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit the environment file with your preferred editor
nano server/.env
```

**Important: Update these values in `server/.env`:**

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://admin:password123@mongodb:27017/shopdb?authSource=admin
```

## Step 5: Build and Start the Application

### Option A: Using Docker Compose (Recommended)

```bash
# Build all Docker images
docker compose build

# Start all services in detached mode
docker compose up -d

# Check the status of all containers
docker compose ps
```

### Option B: Start Services One by One

```bash
# Start MongoDB first
docker compose up -d mongodb
docker compose up -d mongodb

# Wait for MongoDB to be ready (about 30 seconds)
sleep 30

# Start the backend server
docker compose up -d server

# Start the frontend
docker compose up -d client

# Start Nginx reverse proxy
docker compose up -d nginx
```

## Step 6: Verify Installation

```bash
# Check if all containers are running
docker compose ps

# Check application logs
docker compose logs -f

# Check specific service logs
docker compose logs server
docker compose logs client
```

## Step 7: Access the Application

Once all services are running, you can access:

- **Frontend Application**: `http://localhost` or `http://your-server-ip`
- **Backend API**: `http://localhost:5001` or `http://your-server-ip:5001`
- **API Health Check**: `http://localhost:5001/api/health`

## Default Login Credentials

- **Email**: `admin@shop.com`
- **Password**: admin123

## Step 8: Firewall Configuration (If Needed)

### For Rocky 9.0 (firewalld)

```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=5001/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### For Ubuntu 24.04/22.04/20.04 (ufw)

```bash
# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5001/tcp

# Enable firewall if not already enabled
sudo ufw enable
```

## Management Commands

### Start the Application

```bash
docker compose up -d
```

### Stop the Application

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f
```

### Update the Application

```bash
# Pull latest changes
git pull origin main

# Build and start the application
docker compose build
docker compose up -d
```

### Backup Database

```bash
# Create backup
docker compose exec mongodb mongodump --authenticationDatabase admin -u admin -p password123 --db shopdb --out /backup

# Copy backup to host
docker cp rocky-shop-db:/backup ./backup-$(date +%o%m%d)
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backup-20231201 rocky-shop-db:/backup

# Restore database
docker compose exec mongodb mongorestore --authenticationDatabase admin -u admin -p password123 --db shopdb /backup/shopdb
```

## Troubleshooting

### Common Issues

1. **Permission Denied Error**

```bash
# Add user to docker group and logout/login
sudo usermod -aG docker $USER
# Then logout and login again
```

1. **Port Already in Use**

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
# Stop the conflicting service
sudo systemctl stop nginx  # or other service
```

1. **Docker Container Won't Start**

```bash
# Check container logs
docker compose logs [service-name]

# Rebuild the container
docker compose down
docker compose build --no-cache [service-name]
docker compose up -d
```

1. **Database Connection Failed**

```bash
# Check MongoDB container status
docker compose ps mongodb

# Restart MongoDB
docker compose restart mongodb
```

## Security Considerations

1. **Change Default Passwords**
   - Update MongoDB password in `docker compose.yml`
   - Update JWT secret in `.env` file
   - Change admin password after first login

2. **SSL Certificate**
   - For production, configure SSL certificates in Nginx
   - Use Let's Encrypt for free SSL certificates

3. **Regular Updates**

```bash
# Update system packages
sudo dnf update -y  # Rocky 9.0
# or
sudo apt update -y  # Ubuntu 24.04/22.04/20.04

# Update Docker images
docker compose pull
docker compose up -d
```
