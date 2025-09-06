-- Initialize Story Library Database
-- This script sets up the database with proper permissions and settings

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database user if not exists (handled by Docker environment variables)
-- The main database and user are created by the PostgreSQL Docker container

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by Prisma migrations)
-- But we can set some initial configurations here

-- Log that initialization is complete
SELECT 'Story Library database initialized successfully' as status;