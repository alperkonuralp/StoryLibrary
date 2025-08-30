# Story Library - Technical Analysis Document (Claude Code Optimized)

## Claude Code Development Guide

### Technology Stack (Optimized for Claude Code)

- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **State Management**: Zustand
- **Authentication**: NextAuth.js or Passport + JWT

### Why This Stack?

- Full TypeScript support for type safety
- Prisma for type-safe database operations
- Next.js for full-stack capabilities
- shadcn/ui for rapid UI development
- Zod for runtime validation with TypeScript integration

### Initial Setup Commands for Claude Code

```bash
# 1. Create project structure
mkdir story-library && cd story-library

# 2. Initialize backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken nodemon ts-node prisma

# 3. Initialize frontend
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# 4. Setup Prisma
cd backend
npx prisma init

# 5. Run development
npm run dev
```

## 1. Project Overview

### Project Name

**Story Library** - A multilingual story collection platform designed for language learning

### Project Vision

Create a web-based platform where users can read stories in multiple languages (initially Turkish and English) with paragraph-by-paragraph translations to facilitate language learning through contextual reading.

### Core Objectives

- Provide an intuitive reading experience with flexible language display modes
- Enable editors to efficiently manage and publish bilingual content
- Track user reading progress and story completion
- Support scalable content management with categorization and tagging systems
- Facilitate language learning through contextual story reading

## 2. Project Structure

### Folder Organization

```text
story-library/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── storyController.ts
│   │   │   ├── userController.ts
│   │   │   └── categoryController.ts
│   │   ├── models/
│   │   │   └── (Prisma handles this)
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── storyRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── storyService.ts
│   │   │   └── translationService.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── editor/
│   │   │   └── admin/
│   │   ├── stories/
│   │   │   ├── [id]/page.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── story/
│   │   │   ├── StoryReader.tsx
│   │   │   ├── StoryCard.tsx
│   │   │   └── LanguageToggle.tsx
│   │   └── layout/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── storyStore.ts
│   ├── types/
│   ├── .env.local
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 3. Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/story_library?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Translation API (optional)
GOOGLE_TRANSLATE_API_KEY=
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 4. Database Schema (Prisma)

### Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  EDITOR
  USER
}

enum StoryStatus {
  DRAFT
  PUBLISHED
}

enum ReadingStatus {
  STARTED
  COMPLETED
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  username      String?        @unique
  passwordHash  String?
  role          UserRole       @default(USER)
  profile       Json?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  stories       Story[]        @relation("StoryCreator")
  ratings       UserStoryRating[]
  progress      UserReadingProgress[]
  
  @@index([email])
  @@index([username])
}

model Story {
  id                String         @id @default(uuid())
  title             Json           // {"en": "Title", "tr": "Başlık"}
  shortDescription  Json           // {"en": "Description", "tr": "Açıklama"}
  slug              String         @unique
  content           Json           // {"en": ["para1", "para2"], "tr": ["para1", "para2"]}
  status            StoryStatus    @default(DRAFT)
  sourceInfo        Json?          // {"siteName": "...", "originalUrl": "...", "scrapedAt": "..."}
  statistics        Json?          // {"wordCount": {"en": 150, "tr": 140}, ...}
  editorRating      Decimal?       @db.Decimal(3, 2)
  averageRating     Decimal?       @db.Decimal(3, 2)
  ratingCount       Int            @default(0)
  metadata          Json?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  publishedAt       DateTime?
  createdBy         String
  creator           User           @relation("StoryCreator", fields: [createdBy], references: [id])
  
  authors           StoryAuthor[]
  categories        StoryCategory[]
  tags              StoryTag[]
  series            StorySeries[]
  ratings           UserStoryRating[]
  progress          UserReadingProgress[]
  
  @@index([slug])
  @@index([status])
  @@index([publishedAt])
}

model Author {
  id            String         @id @default(uuid())
  name          String
  bio           Json?          // {"en": "Biography", "tr": "Biyografi"}
  slug          String         @unique
  createdAt     DateTime       @default(now())
  
  stories       StoryAuthor[]
  
  @@index([slug])
}

model Category {
  id            String         @id @default(uuid())
  name          Json           // {"en": "Name", "tr": "İsim"}
  description   Json?
  slug          String         @unique
  createdAt     DateTime       @default(now())
  
  stories       StoryCategory[]
  
  @@index([slug])
}

model Tag {
  id            String         @id @default(uuid())
  name          Json           // {"en": "Name", "tr": "İsim"}
  slug          String         @unique
  color         String?
  createdAt     DateTime       @default(now())
  
  stories       StoryTag[]
  
  @@index([slug])
}

model Series {
  id            String         @id @default(uuid())
  name          Json           // {"en": "Name", "tr": "İsim"}
  description   Json?
  slug          String         @unique
  createdAt     DateTime       @default(now())
  
  stories       StorySeries[]
  
  @@index([slug])
}

// Relation Tables
model StoryAuthor {
  storyId       String
  authorId      String
  role          String         @default("author") // 'author', 'co-author', 'translator'
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  author        Author         @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  @@id([storyId, authorId])
}

model StoryCategory {
  storyId       String
  categoryId    String
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  category      Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([storyId, categoryId])
}

model StoryTag {
  storyId       String
  tagId         String
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  tag           Tag            @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([storyId, tagId])
}

model StorySeries {
  storyId       String
  seriesId      String
  orderInSeries Int
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  series        Series         @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  
  @@id([storyId, seriesId])
}

model UserStoryRating {
  id            String         @id @default(uuid())
  userId        String
  storyId       String
  rating        Decimal        @db.Decimal(3, 2)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  
  @@unique([userId, storyId])
  @@index([storyId])
}

model UserReadingProgress {
  id            String         @id @default(uuid())
  userId        String
  storyId       String
  status        ReadingStatus
  lastParagraph Int?
  startedAt     DateTime       @default(now())
  completedAt   DateTime?
  
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  story         Story          @relation(fields: [storyId], references: [id], onDelete: Cascade)
  
  @@unique([userId, storyId])
  @@index([userId])
  @@index([storyId])
}
```

## 5. API Specifications with Validation

### API Response Format
```typescript
// types/api.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error codes
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}
```

### Validation Schemas (Zod)
```typescript
// lib/validations.ts
import { z } from 'zod';

// User schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  username: z.string().min(3).max(30).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Story schemas
export const createStorySchema = z.object({
  title: z.record(z.string()),
  shortDescription: z.record(z.string()),
  content: z.record(z.array(z.string())),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  authorIds: z.array(z.object({
    id: z.string(),
    role: z.enum(['author', 'co-author', 'translator'])
  })).optional()
});

export const ratingSchema = z.object({
  rating: z.number().min(1).max(5).multipleOf(0.5)
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const storyFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  authorId: z.string().optional(),
  seriesId: z.string().optional(),
  language: z.enum(['en', 'tr']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional()
});
```

### Authentication Endpoints
```rest
POST   /api/auth/register
       Body: { email, password, username? }
       Response: { user, token, refreshToken }

POST   /api/auth/login
       Body: { email, password }
       Response: { user, token, refreshToken }

POST   /api/auth/refresh
       Body: { refreshToken }
       Response: { token, refreshToken }

POST   /api/auth/logout
       Headers: Authorization: Bearer <token>
       Response: { message }

GET    /api/auth/me
       Headers: Authorization: Bearer <token>
       Response: { user }

POST   /api/auth/google
       Body: { credential }
       Response: { user, token, refreshToken }
```

### Story Endpoints
```rest
GET    /api/stories
       Query: ?page=1&limit=20&search=...&categoryId=...
       Response: { stories[], pagination }

GET    /api/stories/:id
       Response: { story }

GET    /api/stories/slug/:slug
       Response: { story }

POST   /api/stories [Editor+]
       Body: { title, shortDescription, content, ... }
       Response: { story }

PUT    /api/stories/:id [Editor+]
       Body: { title, shortDescription, content, ... }
       Response: { story }

DELETE /api/stories/:id [Admin]
       Response: { message }

POST   /api/stories/:id/publish [Editor+]
       Response: { story }

POST   /api/stories/:id/unpublish [Editor+]
       Response: { story }

POST   /api/stories/:id/rate [Authenticated]
       Body: { rating }
       Response: { rating, averageRating }

GET    /api/stories/top-rated
       Query: ?limit=10&language=en
       Response: { stories[] }

GET    /api/stories/new
       Query: ?days=7&limit=10
       Response: { stories[] }
```

### Author Endpoints
```rest
GET    /api/authors
       Query: ?page=1&limit=20&search=...
       Response: { authors[], pagination }

GET    /api/authors/:id
       Response: { author }

GET    /api/authors/slug/:slug
       Response: { author }

POST   /api/authors [Editor+]
       Body: { name, bio }
       Response: { author }

PUT    /api/authors/:id [Editor+]
       Body: { name, bio }
       Response: { author }

DELETE /api/authors/:id [Admin]
       Response: { message }

GET    /api/authors/:id/stories
       Query: ?page=1&limit=20
       Response: { stories[], pagination }
```

### Category & Tag Endpoints
```rest
GET    /api/categories
       Response: { categories[] }

POST   /api/categories [Admin]
       Body: { name, description }
       Response: { category }

PUT    /api/categories/:id [Admin]
       Body: { name, description }
       Response: { category }

DELETE /api/categories/:id [Admin]
       Response: { message }

GET    /api/tags
       Response: { tags[] }

POST   /api/tags [Editor+]
       Body: { name, color }
       Response: { tag }

PUT    /api/tags/:id [Editor+]
       Body: { name, color }
       Response: { tag }

DELETE /api/tags/:id [Admin]
       Response: { message }
```

### User Progress Endpoints
```rest
GET    /api/users/progress
       Headers: Authorization: Bearer <token>
       Query: ?status=STARTED|COMPLETED
       Response: { progress[] }

POST   /api/users/progress
       Headers: Authorization: Bearer <token>
       Body: { storyId, lastParagraph, status }
       Response: { progress }

GET    /api/users/completed
       Headers: Authorization: Bearer <token>
       Response: { stories[] }

GET    /api/users/ratings
       Headers: Authorization: Bearer <token>
       Response: { ratings[] }
```

### Series Endpoints
```rest
GET    /api/series
       Response: { series[] }

GET    /api/series/:id
       Response: { series }

GET    /api/series/:id/stories
       Response: { stories[] }

POST   /api/series [Editor+]
       Body: { name, description }
       Response: { series }

PUT    /api/series/:id [Editor+]
       Body: { name, description }
       Response: { series }

DELETE /api/series/:id [Admin]
       Response: { message }
```

## 6. Development Workflow

### Package.json Scripts

#### Root package.json
```json
{
  "name": "story-library",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:push": "cd backend && npx prisma db push",
    "db:seed": "cd backend && npm run seed",
    "db:studio": "cd backend && npx prisma studio",
    "setup": "npm run install:all && npm run db:migrate && npm run db:seed",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

#### Backend package.json
```json
{
  "name": "story-library-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/app.js",
    "seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "nodemonConfig": {
    "watch": ["src"],
    "ext": "ts",
    "exec": "ts-node src/app.ts"
  }
}
```

#### Frontend package.json
```json
{
  "name": "story-library-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  }
}
```

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: story-library-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: story_library
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - story-library-network

  redis:
    image: redis:7-alpine
    container_name: story-library-redis
    ports:
      - "6379:6379"
    networks:
      - story-library-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: story-library-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/story_library?schema=public
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - story-library-network
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: story-library-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - story-library-network
    command: npm run dev

volumes:
  postgres_data:

networks:
  story-library-network:
    driver: bridge
```

## 7. Development Phases (Updated)

### Phase 0: Foundation Setup (Day 1-2)
1. **Project initialization**
   - Create folder structure
   - Initialize npm packages
   - Setup TypeScript configurations
   - Configure ESLint and Prettier

2. **Database setup**
   - Configure PostgreSQL with Docker
   - Create Prisma schema
   - Generate initial migrations
   - Create seed data script

3. **Authentication system**
   - Implement JWT authentication
   - Create auth middleware
   - Setup role-based access control
   - Add refresh token mechanism

### Phase 1: Core Features (Day 3-5)
1. **Story CRUD operations**
   - Create story endpoints
   - Implement multilingual content storage
   - Add validation middleware
   - Build story service layer

2. **Reading interface**
   - Create story reader component
   - Implement 3 display modes (EN only, TR only, bilingual)
   - Add language toggle functionality
   - Store user preferences

3. **Category & Tag system**
   - Create category/tag endpoints
   - Implement many-to-many relationships
   - Add filtering capabilities

### Phase 2: User Features (Day 6-7)
1. **User progress tracking**
   - Implement reading progress API
   - Create progress components
   - Add completion tracking

2. **Rating system**
   - Create rating endpoints
   - Implement rating calculation
   - Add rating UI components

3. **Search functionality**
   - Basic text search
   - Filter by multiple criteria
   - Search result pagination

### Phase 3: Editor Dashboard (Day 8-9)
1. **Content management**
   - Story creation/editing interface
   - Markdown editor integration
   - Translation workflow tools
   - Bulk import functionality

2. **Publishing workflow**
   - Draft/publish states
   - Preview functionality
   - Content validation

### Phase 4: Polish & Deploy (Day 10)
1. **Performance optimization**
   - Add caching layer
   - Optimize database queries
   - Implement lazy loading

2. **Testing & documentation**
   - Write unit tests
   - Create API documentation
   - User guide preparation

3. **Deployment**
   - Production environment setup
   - CI/CD pipeline
   - Monitoring setup

## 8. Claude Code Instructions

### Initial Setup Sequence
```markdown
## Step-by-step instructions for Claude Code:

1. **Initialize Backend**
   - Create backend folder with Express + TypeScript
   - Setup Prisma with PostgreSQL
   - Create the complete schema as provided
   - Generate Prisma client
   - Create seed data with sample stories in EN/TR

2. **Create Authentication System**
   - Implement JWT with refresh tokens
   - Create auth middleware for protected routes
   - Add role-based access control
   - Setup password hashing with bcrypt

3. **Build Core API**
   - Create all CRUD endpoints for stories
   - Implement validation with Zod
   - Add error handling middleware
   - Setup CORS and rate limiting

4. **Initialize Frontend**
   - Setup Next.js 14 with App Router
   - Configure Tailwind CSS
   - Install and setup shadcn/ui
   - Create layout structure

5. **Create Story Components**
   - Build StoryReader with 3 display modes
   - Create language toggle component
   - Add progress tracking
   - Implement rating system

6. **Build Editor Dashboard**
   - Create story creation form
   - Add markdown editor
   - Build translation helper interface
   - Implement publish workflow

7. **Add Search & Filters**
   - Create search API with filters
   - Build search UI components
   - Add category/tag filters
   - Implement pagination

8. **Setup Docker**
   - Create docker-compose.yml
   - Add development containers
   - Configure networking

9. **Testing & Documentation**
   - Write basic tests
   - Create README with setup instructions
   - Add API documentation

10. **Final Polish**
    - Add loading states
    - Implement error boundaries
    - Add success notifications
    - Optimize performance
```

## 9. Seed Data Structure

### Sample Seed Data
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@storylibrary.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    }
  });

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 10);
  const editor = await prisma.user.create({
    data: {
      email: 'editor@storylibrary.com',
      username: 'editor',
      passwordHash: editorPassword,
      role: 'EDITOR',
      profile: {
        firstName: 'Editor',
        lastName: 'User'
      }
    }
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: { en: 'Fiction', tr: 'Kurgu' },
        description: { en: 'Fictional stories', tr: 'Kurgusal hikayeler' },
        slug: 'fiction'
      }
    }),
    prisma.category.create({
      data: {
        name: { en: 'Technology', tr: 'Teknoloji' },
        description: { en: 'Tech articles', tr: 'Teknoloji makaleleri' },
        slug: 'technology'
      }
    }),
    prisma.category.create({
      data: {
        name: { en: 'Business', tr: 'İş' },
        description: { en: 'Business stories', tr: 'İş hikayeleri' },
        slug: 'business'
      }
    })
  ]);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: { en: 'Beginner', tr: 'Başlangıç' },
        slug: 'beginner',
        color: '#10B981'
      }
    }),
    prisma.tag.create({
      data: {
        name: { en: 'Intermediate', tr: 'Orta' },
        slug: 'intermediate',
        color: '#F59E0B'
      }
    }),
    prisma.tag.create({
      data: {
        name: { en: 'Advanced', tr: 'İleri' },
        slug: 'advanced',
        color: '#EF4444'
      }
    })
  ]);

  // Create sample stories
  const story1 = await prisma.story.create({
    data: {
      title: {
        en: 'The Coffee Shop',
        tr: 'Kahve Dükkanı'
      },
      shortDescription: {
        en: 'A story about a magical coffee shop',
        tr: 'Sihirli bir kahve dükkanı hakkında bir hikaye'
      },
      slug: 'the-coffee-shop',
      content: {
        en: [
          'Once upon a time, there was a small coffee shop on the corner of Main Street.',
          'Every morning, people would line up to get their daily dose of caffeine.',
          'But this was no ordinary coffee shop.'
        ],
        tr: [
          'Bir zamanlar, Ana Cadde\'nin köşesinde küçük bir kahve dükkanı vardı.',
          'Her sabah, insanlar günlük kafein dozlarını almak için sıraya girerlerdi.',
          'Ama bu sıradan bir kahve dükkanı değildi.'
        ]
      },
      status: 'PUBLISHED',
      statistics: {
        wordCount: { en: 27, tr: 24 },
        charCount: { en: 156, tr: 148 },
        estimatedReadingTime: { en: 1, tr: 1 }
      },
      editorRating: 4.5,
      averageRating: 4.5,
      ratingCount: 0,
      publishedAt: new Date(),
      createdBy: editor.id,
      categories: {
        create: [
          { categoryId: categories[0].id }
        ]
      },
      tags: {
        create: [
          { tagId: tags[0].id }
        ]
      }
    }
  });

  const story2 = await prisma.story.create({
    data: {
      title: {
        en: 'Introduction to Machine Learning',
        tr: 'Makine Öğrenmesine Giriş'
      },
      shortDescription: {
        en: 'Learn the basics of machine learning',
        tr: 'Makine öğrenmesinin temellerini öğrenin'
      },
      slug: 'introduction-to-machine-learning',
      content: {
        en: [
          'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
          'Instead of being explicitly programmed, these systems improve their performance through experience.',
          'There are three main types of machine learning: supervised, unsupervised, and reinforcement learning.'
        ],
        tr: [
          'Makine öğrenmesi, sistemlerin verilerden öğrenmesini sağlayan yapay zekanın bir alt kümesidir.',
          'Açıkça programlanmak yerine, bu sistemler deneyim yoluyla performanslarını geliştirirler.',
          'Üç ana makine öğrenmesi türü vardır: denetimli, denetimsiz ve pekiştirmeli öğrenme.'
        ]
      },
      status: 'PUBLISHED',
      statistics: {
        wordCount: { en: 38, tr: 32 },
        charCount: { en: 262, tr: 245 },
        estimatedReadingTime: { en: 1, tr: 1 }
      },
      editorRating: 4.0,
      averageRating: 4.0,
      ratingCount: 0,
      publishedAt: new Date(),
      createdBy: editor.id,
      categories: {
        create: [
          { categoryId: categories[1].id }
        ]
      },
      tags: {
        create: [
          { tagId: tags[1].id }
        ]
      }
    }
  });

  console.log('Seed data created successfully!');
  console.log('Admin login: admin@storylibrary.com / admin123');
  console.log('Editor login: editor@storylibrary.com / editor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 10. Error Handling & Validation

### Error Handler Middleware
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors
      }
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: err.meta
        }
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Token expired'
      }
    });
  }

  // Default error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

### Validation Middleware
```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## 11. Frontend Components Structure

### Story Reader Component
```typescript
// components/story/StoryReader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type DisplayMode = 'english' | 'turkish' | 'bilingual';

interface StoryReaderProps {
  story: {
    title: Record<string, string>;
    content: Record<string, string[]>;
  };
  initialMode?: DisplayMode;
}

export function StoryReader({ story, initialMode = 'bilingual' }: StoryReaderProps) {
  const [mode, setMode] = useState<DisplayMode>(initialMode);
  const [visibleTranslations, setVisibleTranslations] = useState<Set<number>>(new Set());

  const toggleTranslation = (index: number) => {
    const newVisible = new Set(visibleTranslations);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisibleTranslations(newVisible);
  };

  // Component implementation...
}
```

### Language Toggle Component
```typescript
// components/story/LanguageToggle.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  mode: 'english' | 'turkish' | 'bilingual';
  onChange: (mode: 'english' | 'turkish' | 'bilingual') => void;
}

export function LanguageToggle({ mode, onChange }: LanguageToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={mode === 'english' ? 'default' : 'outline'}
        onClick={() => onChange('english')}
      >
        English
      </Button>
      <Button
        variant={mode === 'turkish' ? 'default' : 'outline'}
        onClick={() => onChange('turkish')}
      >
        Türkçe
      </Button>
      <Button
        variant={mode === 'bilingual' ? 'default' : 'outline'}
        onClick={() => onChange('bilingual')}
      >
        <Languages className="mr-2 h-4 w-4" />
        Bilingual
      </Button>
    </div>
  );
}
```

## 12. Testing Strategy

### Unit Test Examples
```typescript
// tests/auth.test.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### Integration Test Examples
```typescript
// tests/stories.integration.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';

describe('Story CRUD Operations', () => {
  let authToken: string;
  let storyId: string;

  beforeAll(async () => {
    // Login as editor
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'editor@storylibrary.com',
        password: 'editor123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  it('should create a new story', async () => {
    const response = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: { en: 'Test Story', tr: 'Test Hikaye' },
        shortDescription: { en: 'A test', tr: 'Bir test' },
        content: {
          en: ['Paragraph 1', 'Paragraph 2'],
          tr: ['Paragraf 1', 'Paragraf 2']
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    storyId = response.body.data.id;
  });

  it('should retrieve the created story', async () => {
    const response = await request(app)
      .get(`/api/stories/${storyId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.title.en).toBe('Test Story');
  });
});
```

## 13. Deployment Configuration

### Production Environment Variables
```env
# .env.production
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@production-db:5432/story_library

# JWT
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<another-strong-random-secret>
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=https://storylibrary.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis
REDIS_URL=redis://production-redis:6379

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Dockerfile (Backend)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npm ci --only=production
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
```

### Dockerfile (Frontend)
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

## 14. Monitoring & Logging

### Logging Configuration
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export default logger;
```

## 15. Security Considerations

### Security Middleware
```typescript
// middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  })
];

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter limit for auth endpoints
  skipSuccessfulRequests: true
});
```

## 16. Performance Optimization

### Caching Strategy
```typescript
// services/cacheService.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class CacheService {
  static async get(key: string) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, ttl: number = 3600) {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async del(key: string) {
    await redis.del(key);
  }

  static async invalidatePattern(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  }
}
```

## 17. CI/CD Configuration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm run install:all
      
    - name: Setup database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      run: |
        cd backend
        npx prisma migrate deploy
        
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
```

## 18. Success Metrics & Analytics

### Analytics Implementation
```typescript
// services/analyticsService.ts
export class AnalyticsService {
  static async trackStoryView(storyId: string, userId?: string) {
    // Track story view
  }

  static async trackReadingProgress(
    storyId: string,
    userId: string,
    progress: number
  ) {
    // Track reading progress
  }

  static async trackRating(
    storyId: string,
    userId: string,
    rating: number
  ) {
    // Track rating
  }

  static async getStoryMetrics(storyId: string) {
    // Get story metrics
  }

  static async getUserMetrics(userId: string) {
    // Get user metrics
  }
}
```

---

## Final Notes for Claude Code

This document is optimized for Claude Code implementation. The technology stack has been carefully selected for:

1. **Type Safety**: Full TypeScript support across backend and frontend
2. **Developer Experience**: Modern tools with excellent documentation
3. **Rapid Development**: Prisma for database, Next.js for full-stack
4. **UI Development**: Tailwind + shadcn/ui for quick, consistent UI
5. **Validation**: Zod for runtime validation with TypeScript integration

### Implementation Priority:
1. Start with the backend API and database
2. Create authentication system
3. Build core CRUD operations
4. Develop frontend with reading interface
5. Add editor features
6. Implement search and filters
7. Add progress tracking and ratings
8. Polish and optimize

### Key Success Factors:
- Use Prisma's type generation for type-safe database operations
- Leverage Next.js API routes for BFF pattern if needed
- Implement proper error handling from the start
- Use Zod schemas for both validation and TypeScript types
- Keep components modular and reusable

---

**Document Version**: 3.0 (Claude Code Optimized)  
**Last Updated**: August 2025  
**Prepared For**: Claude Code Implementation  
**Project Scope**: Multilingual Story Learning Platform