# Story Library - Raspberry Pi 5 + CasaOS Deployment Guide

This guide will help you deploy the Story Library application to your Raspberry Pi 5 with CasaOS.

## Prerequisites

- Raspberry Pi 5 with CasaOS installed
- At least 4GB RAM (8GB recommended)
- 32GB+ microSD card (or SSD for better performance)
- SSH access to your Pi
- Docker and Docker Compose installed (usually comes with CasaOS)

## Pre-Deployment Setup

### 1. Get Your Pi's IP Address
```bash
ip addr show
# Note your Pi's IP address (e.g., 192.168.1.100)
```

### 2. Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Verify Docker Installation
```bash
docker --version
docker-compose --version
```

## Deployment Steps

### 1. Transfer Files to Your Pi

**Option A: Using Git (Recommended)**
```bash
# On your Pi
cd /home/$USER/
git clone <your-repository-url> story-library
cd story-library
```

**Option B: Using SCP/SFTP**
```bash
# From your development machine
scp -r C:\Projects\story-library pi@YOUR_PI_IP:/home/pi/
```

### 2. Configure Environment Variables

Edit the production environment files with your Pi's IP address:

**Backend Environment (.env.production):**
```bash
nano .env.production
```
Update:
- `FRONTEND_URL=http://YOUR_PI_IP:3000`
- Change all secrets (JWT_SECRET, etc.)
- Set secure database password

**Frontend Environment (frontend/.env.production):**
```bash
nano frontend/.env.production
```
Update:
- `NEXT_PUBLIC_API_URL=http://YOUR_PI_IP:3001/api`
- `NEXT_PUBLIC_APP_URL=http://YOUR_PI_IP:3000`
- `NEXTAUTH_URL=http://YOUR_PI_IP:3000`
- Change NEXTAUTH_SECRET

### 3. Update Docker Compose Configuration

Edit `docker-compose.production.yml`:
```bash
nano docker-compose.production.yml
```
Update:
- Change `your_secure_password` to a strong password
- Update `NEXT_PUBLIC_API_URL` environment variable

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build

# Check if all services are running
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 5. Verify Deployment

1. **Check Database Connection:**
```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U story_user -d story_library -c "\dt"
```

2. **Access the Application:**
- Frontend: `http://YOUR_PI_IP:3000`
- Backend API: `http://YOUR_PI_IP:3001/api/health`

3. **Check Service Health:**
```bash
docker-compose -f docker-compose.production.yml exec backend curl -f http://localhost:3001/api/health
```

## CasaOS Integration

### Adding to CasaOS Dashboard

1. **Open CasaOS Web Interface** (usually at `http://YOUR_PI_IP`)
2. **Go to App Store** > **Custom Install**
3. **Use Docker Compose** option
4. **Paste the docker-compose.production.yml** content
5. **Set Environment Variables** in CasaOS interface
6. **Deploy**

### CasaOS Configuration

The docker-compose file includes CasaOS-specific labels:
- Service icons and descriptions
- Proper categorization
- Main service designation for the frontend

## Post-Deployment Configuration

### 1. Create Admin User

Access the application and register the first user, or create via API:

```bash
curl -X POST http://YOUR_PI_IP:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure_password",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### 2. Set User as Admin

Connect to database and update user role:
```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U story_user -d story_library

UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@yourdomain.com';
\q
```

### 3. Test All Features

- User registration and login
- Story creation (as admin)
- Story reading
- Category and author management
- Search functionality

## Monitoring and Maintenance

### Health Checks

All services include health checks. Monitor with:
```bash
docker-compose -f docker-compose.production.yml ps
```

### Backup Database

Create regular backups:
```bash
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U story_user story_library > backup_$(date +%Y%m%d).sql
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

## Performance Optimization for Pi 5

### 1. Enable Docker BuildKit
```bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

### 2. Optimize Container Resources

The compose file includes:
- Memory limits for Redis
- Health check intervals optimized for Pi
- Proper restart policies

### 3. Storage Optimization

Consider using SSD instead of microSD for better I/O performance:
```bash
# Move Docker data to SSD if available
sudo systemctl stop docker
sudo mv /var/lib/docker /path/to/ssd/docker
sudo ln -s /path/to/ssd/docker /var/lib/docker
sudo systemctl start docker
```

## Troubleshooting

### Common Issues

1. **Port Conflicts:**
```bash
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

2. **Memory Issues:**
```bash
free -h
docker system prune -a
```

3. **Database Connection Issues:**
```bash
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U story_user -d story_library
```

4. **Frontend Build Issues:**
```bash
# Clear Node modules and rebuild
docker-compose -f docker-compose.production.yml exec frontend rm -rf node_modules .next
docker-compose -f docker-compose.production.yml restart frontend
```

### Service URLs

- **Main Application:** http://YOUR_PI_IP:3000
- **API Health Check:** http://YOUR_PI_IP:3001/api/health
- **Database:** localhost:5432 (internal only)
- **Redis:** localhost:6379 (internal only)

## Security Notes

1. **Change Default Passwords:** Update all default passwords in environment files
2. **Firewall:** Configure UFW if needed
3. **SSL/TLS:** Consider adding reverse proxy with SSL for production use
4. **Regular Updates:** Keep system and containers updated

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify all services are healthy
3. Check Pi system resources (CPU, memory, disk)
4. Ensure network connectivity

## Optional Enhancements

### Reverse Proxy with SSL

Consider adding Traefik or nginx for:
- SSL termination
- Custom domains
- Load balancing

### Monitoring

Add Portainer for container management:
```bash
docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce
```

Access at `http://YOUR_PI_IP:9000`