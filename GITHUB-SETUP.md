# GitHub Repository Setup Guide

## Quick Setup Steps

### 1. Create Repository on GitHub

1. Go to `https://github.com`
2. Click "+" → "New repository"
3. **Repository name**: `rocky-shop-system`
4. **Description**: `Full-featured e-commerce shop system for Rocky 9.0/Ubuntu Linux`
5. **Visibility**: Public or Private (your choice)
6. **⚠️ Important**: DO NOT check any initialization options
7. Click "Create repository"

### 2. Initialize Git Locally

```bash
# Navigate to your project directory
cd rocky-shop-system

# Initialize Git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Rocky Shop System with Docker deployment"
```

### 3. Connect to GitHub

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/rocky-shop-system.git

# Set main branch and push
git branch -M main
git push -u origin main
```

### 4. Update Repository URLs

After creating your repository, replace `YOUR_USERNAME` in these files:

- `setup.sh` (lines 112, 120, 128)
- `INSTALLATION.md` (lines 126, 144, 162)
- `INSTALLATION-WINDOWS.md` (lines 71, 82, 93)

**Example**: Replace `YOUR_USERNAME` with `RealAprilF00lz`

### 5. Test the Setup

```bash
# Commit the updated URLs
git add .
git commit -m "Update repository URLs for GitHub setup"
git push origin main

# Test installation (from a different directory)
cd /tmp
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/rocky-shop-system/main/setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

## Repository Structure

Your GitHub repository will contain:

```text
rocky-shop-system/
├── README.md                    # Main documentation
├── INSTALLATION.md              # Detailed installation guide
├── INSTALLATION-WINDOWS.md      # Quick reference guide
├── GITHUB-SETUP.md              # This file
├── setup.sh                     # Automated installation script
├── package.json                 # Root package configuration
├── docker-compose.yml           # Docker orchestration
├── server/                      # Backend application
│   ├── package.json
│   ├── index.js
│   ├── Dockerfile
│   ├── .env.example
│   ├── init-mongo.js
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── uploads/
└── client/                      # Frontend application
    ├── package.json
    ├── Dockerfile
    └── public/
```

## Next Steps

1. **Customize** the repository with your own branding
2. **Update** the default admin credentials in documentation
3. **Configure** GitHub Actions for CI/CD (optional)
4. **Set up** GitHub Pages for documentation (optional)
5. **Create** releases for version management

## Support

- Issues: Use GitHub Issues for bug reports
- Discussions: Use GitHub Discussions for questions
- Wiki: Use GitHub Wiki for additional documentation
