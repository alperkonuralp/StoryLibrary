# 🚀 Story Library - Ready for Deployment!

Your Story Library application is now configured for your Raspberry Pi server.

## 📊 Server Configuration

- **Server IP**: `192.168.111.236`
- **Frontend URL**: http://192.168.111.236:30010
- **Backend API**: http://192.168.111.236:30011/api
- **Database**: PostgreSQL (internal)
- **Cache**: Redis (internal)

## 🔐 Security Configuration

All secrets have been auto-generated and configured:
- ✅ JWT Secret: Generated
- ✅ JWT Refresh Secret: Generated  
- ✅ NextAuth Secret: Generated
- ✅ Database Password: Generated

## 🐳 Quick Deployment Steps

### 1. Transfer Files to Your Pi
```bash
# Copy the entire story-library folder to your Pi
scp -r story-library pi@192.168.111.236:/home/pi/
```

### 2. Connect to Your Pi
```bash
ssh pi@192.168.111.236
cd /home/pi/story-library
```

### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build

# Check if all services are running
docker-compose -f docker-compose.production.yml ps

# View logs (optional)
docker-compose -f docker-compose.production.yml logs -f
```

### 4. Create Admin User
After deployment, visit http://192.168.111.236:30010 and:
1. Register your first user account
2. Connect to database to make yourself admin:
```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U story_user -d story_library
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@domain.com';
\q
```

## 🎯 Access Points

- **Main Application**: http://192.168.111.236:30010
- **Stories Page**: http://192.168.111.236:30010/stories
- **Admin Panel**: http://192.168.111.236:30010/admin
- **API Health**: http://192.168.111.236:30011/api/health

## 🔧 CasaOS Integration

The deployment includes CasaOS-specific labels for easy integration:
1. Open CasaOS dashboard
2. Go to App Store → Custom Install
3. Use Docker Compose option
4. Upload the `docker-compose.production.yml` file
5. Deploy!

## 📦 What's Included

- **Frontend**: Next.js 14 web application
- **Backend**: Node.js API server  
- **Database**: PostgreSQL 15 with automatic migration
- **Cache**: Redis for performance
- **Health Checks**: All services monitored
- **Persistence**: Data survives container restarts
- **Security**: Production-ready configuration

## 🛠️ Useful Commands

```bash
# View all services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Restart specific service
docker-compose -f docker-compose.production.yml restart [service-name]

# Stop all services
docker-compose -f docker-compose.production.yml down

# Update application
git pull && docker-compose -f docker-compose.production.yml up -d --build
```

## 🎉 You're Ready!

Your Story Library application is fully configured and ready to deploy to your Raspberry Pi 5 with CasaOS!

All configuration files have been updated with:
✅ Your server IP (192.168.111.236)  
✅ Secure production secrets
✅ Optimized Docker configuration
✅ CasaOS compatibility
✅ ARM64/Raspberry Pi optimization

Just copy the files to your Pi and run the docker-compose command!