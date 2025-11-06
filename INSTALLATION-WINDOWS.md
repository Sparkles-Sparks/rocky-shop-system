# Installation Guide for Rocky 9.0/Ubuntu Linux

## Quick Start (3 Commands)

```bash
# 1. Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh

# 2. Wait for installation to complete (5-10 minutes)
# 3. Access your shop at `http://localhost`
```

## Manual Installation Steps

### Step 1: Install Docker

#### For Rocky 9.0/RHEL-based Systems

```bash
sudo dnf update -y
sudo dnf install -y dnf-utils device-mapper-persistent-data lvm2
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### For Ubuntu 24.04/22.04/20.04/Debian-based Systems

```bash
sudo apt update -y
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### Step 2: Install Download Tools (Optional)

The setup script prioritizes wget and curl to avoid authentication prompts:

```bash
# Option A: wget (Recommended - No authentication)
sudo dnf install -y wget unzip  # Rocky 9.0
sudo apt install -y wget unzip  # Ubuntu

# Option B: curl (Alternative - No authentication)  
sudo dnf install -y curl unzip  # Rocky 9.0
sudo apt install -y curl unzip  # Ubuntu

# Option C: git (Requires authentication for private repos)
sudo dnf install -y git  # Rocky 9.0
sudo apt install -y git  # Ubuntu
```

**Note:** The automated setup script automatically tries wget first, then curl, and only uses git as fallback.

### Step 3: Download and Setup

#### Option A: Using wget (Recommended - No authentication)

```bash
# Download and extract
wget https://github.com/YOUR_USERNAME/rocky-shop-system/archive/main.zip -O rocky-shop-system.zip
unzip rocky-shop-system.zip
mv rocky-shop-system-main rocky-shop-system
cd rocky-shop-system
rm ../rocky-shop-system.zip
```

#### Option B: Using curl (Alternative - No authentication)

```bash
# Download and extract
curl -L https://github.com/YOUR_USERNAME/rocky-shop-system/archive/main.zip -o rocky-shop-system.zip
unzip rocky-shop-system.zip
mv rocky-shop-system-main rocky-shop-system
cd rocky-shop-system
rm ../rocky-shop-system.zip
```

#### Option C: Using Git (Requires authentication)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rocky-shop-system.git rocky-shop-system
cd rocky-shop-system
```

#### Setup Environment

```bash
# Setup environment
cp server/.env.example server/.env

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
awk -v secret="$JWT_SECRET" '{gsub(/your-super-secret-jwt-key-change-this-in-production/, secret)}1' server/.env > server/.env.tmp && mv server/.env.tmp server/.env

# Build and start
docker compose build
docker compose up -d
```

### Step 4: Verify Installation

```bash
# Check services
docker compose ps

# Check logs
docker compose logs -f

# Test API
curl `http://localhost:5001/api/health`
```

## Access Information

- **Frontend**: `http://localhost`
- **Backend API**: `http://localhost:5001`
- **Default Admin**: `admin@shop.com` / admin123

## Management Commands

```bash
# Stop services
docker compose down

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Update
git pull
docker compose down
docker compose build
docker compose up -d
```

## Troubleshooting

### Docker Permission Issues

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Port Conflicts

```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80
# Stop conflicting service
sudo systemctl stop nginx
```

### Database Issues

```bash
# Restart MongoDB
docker compose restart mongodb

# Check MongoDB logs
docker compose logs mongodb
```

## Production Setup

### Firewall Configuration

```bash
# Rocky 9.0 (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# Ubuntu (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx  # Rocky 9.0
# or
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

### Security Hardening

1. Change default passwords
2. Update JWT secret
3. Configure SSL
4. Set up regular backups
5. Monitor logs

## Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Verify Docker is running: `sudo systemctl status docker`
3. Check ports: `netstat -tulpn`
4. Review this guide and README.md
