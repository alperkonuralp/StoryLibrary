#!/bin/bash

# Story Library Deployment Script for Raspberry Pi 5 + CasaOS
# Usage: ./deploy.sh [PI_IP_ADDRESS]

set -e  # Exit on any error

PI_IP=${1:-"192.168.1.100"}  # Default IP, override with first argument
echo "🚀 Deploying Story Library to Raspberry Pi at $PI_IP"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if required files exist
check_files() {
    print_step "Checking required files..."
    
    required_files=(
        "docker-compose.production.yml"
        ".env.production" 
        "frontend/.env.production"
        "backend/Dockerfile"
        "frontend/Dockerfile"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_status "All required files present ✓"
}

# Update environment files with Pi IP
update_env_files() {
    print_step "Updating environment files with Pi IP ($PI_IP)..."
    
    # Update backend .env.production
    sed -i.bak "s/your-pi-ip/$PI_IP/g" .env.production
    print_status "Updated backend environment ✓"
    
    # Update frontend .env.production
    sed -i.bak "s/your-pi-ip/$PI_IP/g" frontend/.env.production
    print_status "Updated frontend environment ✓"
    
    # Update docker-compose.yml
    sed -i.bak "s/localhost:3001/$PI_IP:3001/g" docker-compose.production.yml
    print_status "Updated docker-compose configuration ✓"
}

# Generate secure secrets
generate_secrets() {
    print_step "Generating secure secrets..."
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    NEXTAUTH_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    # Update backend .env
    sed -i.bak "s/your-super-secret-jwt-key-for-production-change-this-immediately/$JWT_SECRET/g" .env.production
    sed -i.bak "s/your-refresh-token-secret-for-production-change-this-immediately/$JWT_REFRESH_SECRET/g" .env.production
    sed -i.bak "s/your_secure_password/$DB_PASSWORD/g" .env.production
    
    # Update frontend .env
    sed -i.bak "s/your-nextauth-secret-key-for-production-change-this-immediately/$NEXTAUTH_SECRET/g" frontend/.env.production
    
    # Update docker-compose
    sed -i.bak "s/your_secure_password/$DB_PASSWORD/g" docker-compose.production.yml
    
    print_status "Generated secure secrets ✓"
}

# Validate Docker Compose
validate_compose() {
    print_step "Validating Docker Compose configuration..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f docker-compose.production.yml config >/dev/null
        print_status "Docker Compose configuration valid ✓"
    else
        print_warning "Docker Compose not found locally - skipping validation"
    fi
}

# Main deployment function
deploy() {
    print_step "Starting deployment..."
    
    echo "🔧 Configuration Summary:"
    echo "   Pi IP Address: $PI_IP"
    echo "   Frontend URL: http://$PI_IP:3000"
    echo "   Backend API: http://$PI_IP:3001/api"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi
    
    check_files
    update_env_files
    generate_secrets
    validate_compose
    
    print_status "✅ Deployment preparation complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy all files to your Raspberry Pi"
    echo "2. Run: docker-compose -f docker-compose.production.yml up -d --build"
    echo "3. Access your app at: http://$PI_IP:3000"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
}

# Run deployment
deploy