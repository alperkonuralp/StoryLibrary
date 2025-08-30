# Story Library

A multilingual story collection platform designed for language learning. Read stories in Turkish and English with paragraph-by-paragraph translations to facilitate language learning through contextual reading.

## Features

- **Bilingual Reading**: Read stories in Turkish and English side-by-side
- **Flexible Display Modes**: Choose between English-only, Turkish-only, or bilingual view
- **Progress Tracking**: Track your reading progress and completed stories
- **Content Management**: Comprehensive editor dashboard for managing stories
- **User Management**: Role-based access control (Admin, Editor, User)
- **Search & Filter**: Advanced search and filtering capabilities
- **Rating System**: Rate and review stories
- **Categories & Tags**: Organize stories with categories and tags

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Caching**: Redis
- **File Upload**: Multer

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL
- **Caching**: Redis

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- Git

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd story-library
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

4. **Start the database**
   ```bash
   docker-compose up postgres redis -d
   ```

5. **Setup the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database Studio: http://localhost:5555 (run `npm run db:studio`)

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/story_library?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

## Development

### Available Scripts

#### Root Level
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both backend and frontend for production
- `npm run install:all` - Install dependencies for all projects
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests for both projects
- `npm run lint` - Lint both projects

#### Backend Specific
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database
- `npm test` - Run tests
- `npm run lint` - Run ESLint

#### Frontend Specific
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm test` - Run tests

### Database Management

```bash
# Generate Prisma client
cd backend && npx prisma generate

# Create and apply migration
cd backend && npx prisma migrate dev --name migration-name

# Reset database
cd backend && npx prisma migrate reset

# Open Prisma Studio
cd backend && npx prisma studio
```

## Project Structure

```
story-library/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── prisma/              # Database schema and migrations
│   └── tests/               # Backend tests
├── frontend/                # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript types
├── docker-compose.yml       # Docker services configuration
└── package.json            # Root package.json with workspace scripts
```

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth/*` - Authentication (login, register, refresh)
- `/api/stories/*` - Story management
- `/api/authors/*` - Author management
- `/api/categories/*` - Category management
- `/api/tags/*` - Tag management
- `/api/series/*` - Series management
- `/api/users/*` - User management and progress tracking

### Authentication

The API uses JWT tokens for authentication:
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Include the access token in the Authorization header: `Bearer <token>`

### Default Users

After running the seed script, you can login with:

- **Admin**: admin@storylibrary.com / admin123
- **Editor**: editor@storylibrary.com / editor123

## Deployment

### Using Docker

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Production deployment**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### Manual Deployment

1. **Build the applications**
   ```bash
   npm run build
   ```

2. **Setup production database**
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run seed
   ```

3. **Start the services**
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend
   cd frontend && npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@storylibrary.com or create an issue in the repository.