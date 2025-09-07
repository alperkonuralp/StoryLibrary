# Production Environment Variables for Story Library - Optimized/Lean Version

# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration (Update these for your Pi)
DATABASE_URL="postgresql://story_user:09921823ba83b41a3f558dc39560d0d0@postgres:5432/story_library?schema=public"

# JWT Configuration
JWT_SECRET=adb407de3ece3d3b4acef1d9936332120a23e789ddca2471889ec327b65acaca
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dc5f5cd34a2d6f75b90b268006b803a6ff3579d4a835a20c7e32c145e4d8d1d4
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
FRONTEND_URL=http://192.168.111.236:30010

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration - DISABLED for lean deployment
# REDIS_URL=redis://redis:6379

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Translation API (optional)
GOOGLE_TRANSLATE_API_KEY=

# Monitoring
SENTRY_DSN=