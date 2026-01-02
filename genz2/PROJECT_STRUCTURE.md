# Project Structure and Details - InstaClone

## Project Overview
InstaClone is a production-ready Instagram-like platform built with Next.js 15, TypeScript, Tailwind CSS, and Prisma. It's a full-featured social media application with user authentication, posts, comments, likes, follows, notifications, messaging, and AI-powered features.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Database**: Prisma ORM with SQLite
- **Authentication**: NextAuth.js v4
- **State Management**: Zustand
- **AI Features**: z-ai-web-dev-sdk
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Drag & Drop**: DND Kit
- **Internationalization**: Next Intl
- **Image Processing**: Sharp

## Core Features Implemented
- ✅ User Authentication (signup/login)
- ✅ User Profiles with customizable avatars, bios, websites
- ✅ Post System with image upload and captions
- ✅ Feed System (home feed, explore page)
- ✅ Social Interactions (likes, comments, replies, follows, bookmarks)
- ✅ Real-time Notifications
- ✅ Search functionality
- ✅ Messaging system (UI ready)
- ✅ AI Image Generation
- ✅ AI Caption Generation
- ✅ Responsive design with dark mode support

## Folder Structure

```
c:/Users/abhib/OneDrive/Desktop/genz2/
├── .dockerignore
├── .gitignore
├── bun.lock
├── Caddyfile
├── check-reels.js
├── components.json
├── create-test-notifications.js
├── custom.db
├── Dockerfile
├── eslint.config.mjs
├── fix-reel-thumbnails.js
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── PRODUCTION_SETUP.md
├── PROJECT_README.md
├── README.md
├── REELS_FEATURE.md
├── render.yaml
├── seed-test-user.js
├── server.js
├── tailwind.config.ts
├── test-upload.txt
├── TODO.md
├── tsconfig.json
├── db/
├── examples/
│   └── websocket/
│       ├── frontend.tsx
│       └── server.ts
├── mini-services/
│   └── .gitkeep
├── prisma/
│   ├── schema.prisma
│   ├── schema.prisma.backup
│   ├── db/
│   │   └── custom.db
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260102075936_add_follow_status/
│           └── migration.sql
├── public/
│   ├── logo.svg
│   ├── robots.txt
│   └── uploads/
│       └── stories/
│           └── test.txt
├── skills/
│   ├── __MACOSX/
│   │   ├── ._ASR
│   │   ├── ._canvas-design
│   │   ├── ._document-skills
│   │   ├── ._frontend-design
│   │   ├── ._image-generation
│   │   ├── ._LLM
│   │   ├── ._video-generation
│   │   ├── ._VLM
│   │   ├── ._web-reader
│   │   ├── ._web-search
│   │   ├── ASR/
│   │   ├── canvas-design/
│   │   ├── document-skills/
│   │   ├── frontend-design/
│   │   ├── image-generation/
│   │   ├── LLM/
│   │   ├── TTS/
│   │   ├── video-generation/
│   │   ├── VLM/
│   │   ├── web-reader/
│   │   └── web-search/
│   ├── ASR/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── asr.ts
│   ├── canvas-design/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── canvas-fonts/
│   │       ├── ArsenalSC-OFL.txt
│   │       ├── ArsenalSC-Regular.ttf
│   │       ├── BigShoulders-Bold.ttf
│   │       ├── BigShoulders-OFL.txt
│   │       ├── BigShoulders-Regular.ttf
│   │       ├── Boldonse-OFL.txt
│   │       ├── Boldonse-Regular.ttf
│   │       ├── BricolageGrotesque-Bold.ttf
│   │       ├── BricolageGrotesque-OFL.txt
│   │       ├── BricolageGrotesque-Regular.ttf
│   │       ├── CrimsonPro-Bold.ttf
│   │       ├── CrimsonPro-Italic.ttf
│   │       ├── CrimsonPro-OFL.txt
│   │       ├── CrimsonPro-Regular.ttf
│   │       ├── DMMono-OFL.txt
│   │       ├── DMMono-Regular.ttf
│   │       ├── EricaOne-OFL.txt
│   │       ├── EricaOne-Regular.ttf
│   │       ├── GeistMono-Bold.ttf
│   │       ├── GeistMono-OFL.txt
│   │       ├── GeistMono-Regular.ttf
│   │       ├── Gloock-OFL.txt
│   │       ├── Gloock-Regular.ttf
│   │       ├── IBMPlexMono-Bold.ttf
│   │       ├── IBMPlexMono-OFL.txt
│   │       ├── IBMPlexMono-Regular.ttf
│   │       ├── IBMPlexSerif-Bold.ttf
│   │       ├── IBMPlexSerif-BoldItalic.ttf
│   │       ├── IBMPlexSerif-Italic.ttf
│   │       ├── IBMPlexSerif-Regular.ttf
│   │       ├── InstrumentSans-Bold.ttf
│   │       ├── InstrumentSans-BoldItalic.ttf
│   │       ├── InstrumentSans-Italic.ttf
│   │       ├── InstrumentSans-OFL.txt
│   │       └── InstrumentSans-Regular.ttf
│   ├── document-skills/
│   │   ├── docx/
│   │   ├── pdf/
│   │   ├── pptx/
│   │   └── xlsx/
│   ├── frontend-design/
│   │   ├── .gitignore
│   │   ├── LICENSE
│   │   ├── OPTIMIZATION_SUMMARY.md
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── SKILL.md
│   │   ├── examples/
│   │   └── templates/
│   ├── image-generation/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── LLM/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── TTS/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── tts.ts
│   ├── video-generation/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── VLM/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── web-reader/
│   │   ├── LICENSE.txt
│   │   ├── SKILL.md
│   │   └── scripts/
│   └── web-search/
│       ├── LICENSE.txt
│       ├── SKILL.md
│       └── scripts/
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── ai/
    │   ├── api/
    │   ├── auth/
    │   ├── create/
    │   ├── explore/
    │   ├── login/
    │   ├── messages/
    │   ├── not-found/
    │   ├── notifications/
    │   ├── posts/
    │   ├── profile/
    │   ├── reels/
    │   ├── search/
    │   ├── settings/
    │   ├── signup/
    │   └── stories/
    ├── components/
    │   ├── providers.tsx
    │   ├── layout/
    │   ├── posts/
    │   ├── reels/
    │   ├── stories/
    │   └── ui/
    ├── hooks/
    │   ├── use-mobile.ts
    │   ├── use-notifications.ts
    │   ├── use-toast.ts
    │   └── use-unread-messages.ts
    ├── lib/
    │   ├── auth.ts
    │   ├── cloudinary.ts
    │   ├── db.ts
    │   ├── notifications.ts
    │   ├── utils.ts
    │   ├── websocket-fixed.js
    │   └── websocket.js
    └── types/
        └── next-auth.d.ts
```

## Key Directories and Files Description

### Root Level Files
- **package.json**: Project dependencies and scripts
- **next.config.ts**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **tsconfig.json**: TypeScript configuration
- **prisma/schema.prisma**: Database schema definition
- **Dockerfile**: Docker container configuration
- **render.yaml**: Deployment configuration for Render
- **Caddyfile**: Web server configuration
- **server.js**: Custom server setup
- **README.md**: General project information
- **PROJECT_README.md**: Detailed project documentation
- **PRODUCTION_SETUP.md**: Production deployment guide
- **REELS_FEATURE.md**: Reels feature documentation
- **TODO.md**: Development tasks and roadmap

### src/ Directory
- **app/**: Next.js App Router pages and API routes
  - **api/**: Backend API endpoints
  - **globals.css**: Global styles
  - **layout.tsx**: Root layout component
  - **page.tsx**: Home page
- **components/**: Reusable React components
  - **ui/**: shadcn/ui component library
  - **layout/**: Layout components (sidebar, navigation)
  - **posts/**: Post-related components
  - **reels/**: Reels components
  - **stories/**: Stories components
- **hooks/**: Custom React hooks
- **lib/**: Utility functions and configurations
- **types/**: TypeScript type definitions

### prisma/ Directory
- **schema.prisma**: Database schema with all models
- **migrations/**: Database migration files

### public/ Directory
- Static assets served by Next.js
- **uploads/**: User-uploaded content

### skills/ Directory
- AI skill modules for various functionalities
- Includes ASR, canvas-design, document-skills, frontend-design, image-generation, LLM, TTS, video-generation, VLM, web-reader, web-search

### examples/ Directory
- Example implementations, including WebSocket examples

## Database Schema

### Core Models
- **User**: User accounts with profile information
- **Post**: User posts with images and captions
- **Comment**: Post comments with reply support
- **Like**: Post likes
- **Follow**: User follow relationships
- **Notification**: User notifications
- **Message**: Direct messages
- **Bookmark**: Saved posts
- **Story**: User stories
- **StoryView**: Story view tracking
- **Hashtag**: Hashtags
- **PostHashtag**: Post-hashtag relationships

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts?userId=X` - Get user's posts
- `POST /api/posts` - Create new post
- `GET/DELETE /api/posts/[postId]` - Get/delete post
- `POST/DELETE /api/posts/[postId]/like` - Like/unlike post
- `GET/POST /api/posts/[postId]/comments` - Get/add comments

### Users
- `GET/PUT /api/users/[username]` - Get/update user profile
- `POST/DELETE /api/users/[username]/follow` - Follow/unfollow user

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/[id]/read` - Mark notification as read

### Search
- `GET /api/search?q=query` - Search users

### AI Features
- `POST /api/ai/generate-image` - Generate AI image
- `POST /api/ai/generate-caption` - Generate AI caption

## Development Setup

1. Install dependencies: `bun install`
2. Set up environment variables in `.env`
3. Initialize database: `bun run db:push`
4. Start development server: `bun run dev`

## Production Considerations

- Implement password hashing with bcrypt
- Use secure NEXTAUTH_SECRET
- Switch to PostgreSQL for production database
- Implement cloud storage for images
- Add rate limiting and HTTPS
- Configure proper environment variables

## Future Enhancements
- Real-time updates with WebSocket
- Story creation and viewing
- Video posts and Reels
- Post editing
- Multiple image posts
- Hashtag search and pages
- Email verification
- Two-factor authentication
- Privacy settings

This project provides a solid foundation for a social media platform with modern web technologies and AI integration.
