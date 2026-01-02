# Instagram Clone - Production Setup

This guide shows you how to configure the application for production with **Cloudinary** for scalable image storage.

## 📋 Prerequisites

- Node.js 18+ and bun
- Database with Prisma (SQLite for dev, PostgreSQL for production)
- Cloudinary account (free tier available)

## 🔧 Cloudinary Setup

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/console](https://cloudinary.com/console)
2. Create a free account or sign in
3. Create a new cloud (or use the default one)

### 2. Get Your Credentials

1. Go to **Dashboard → Settings → API Keys**
2. Note down these values:
   - **Cloud Name**: (found at top of dashboard)
   - **API Key**: Environment variable
   - **API Secret**: (Click "Show" to reveal)

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/instaclone"

# NextAuth
NEXTAUTH_SECRET="your-very-secure-random-secret-key"

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Optional: Create Upload Preset

For production, you can create an upload preset to automatically optimize images:

1. Go to **Settings → Upload** in Cloudinary console
2. Click **"Upload preset"** → "Add upload preset**
3. Configure:
   - **Name**: `instaclone-upload`
   - **Mode**: "Make"
   - **Folder**: `instaclone`
   - **Transformation**: Add optimization if desired
4. Save the preset name to your `.env`:

```bash
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="instaclone-upload"
```

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add Environment Variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (optional)
4. Deploy!

### Option 2: Railway

1. Push code to GitHub
2. Import project in [Railway](https://railway.app/new)
3. Configure environment variables
4. Deploy!

### Option 3: Self-hosted (Docker)

1. Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

2. Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${CLOUD_NAME}
      - NEXT_PUBLIC_CLOUDINARY_API_KEY=${API_KEY}
      - CLOUDINARY_API_SECRET=${API_SECRET}
      - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=${UPLOAD_PRESET}
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=instaclone
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

3. Run:

```bash
docker-compose up -d
```

## 📊 Database Setup for Production

### PostgreSQL (Recommended)

Update your Prisma schema connection string in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:

```bash
bunx prisma migrate deploy
```

## 🎯 Features Enabled with Cloudinary

✅ **Scalable Image Storage** - No size limits
✅ **Automatic Optimization** - Resize and compress images
✅ **CDN Delivery** - Fast image serving worldwide
✅ **Backup** - Images are stored securely in the cloud
✅ **Transformations** - Create thumbnails, watermarks, etc.
✅ **Video Support** - Upload videos easily

## 🧪 Testing Production Build

1. Test locally with production environment variables:

```bash
bun install
bun run build
bun run start
```

2. Test all features:
   - ✅ User registration and login
   - ✅ Image upload to Cloudinary
   - ✅ Post creation with Cloudinary images
   - ✅ AI image generation
   - ✅ Stories creation
   - ✅ All API endpoints

## 📈 Monitoring & Analytics

Add these tools in production:

### Application Monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Performance monitoring

### Analytics
- [Vercel Analytics](https://vercel.com/analytics) - If using Vercel
- [Cloudinary Analytics](https://cloudinary.com/console/analytics) - Image storage metrics

## 🔒 Security Checklist for Production

- [ ] Change default `NEXTAUTH_SECRET` to a strong random value
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Set up rate limiting on API routes
- [ ] Add CORS configuration if needed
- [ ] Implement proper error handling
- [ ] Set up database backups
- [ ] Add content moderation (for user-generated content)
- [ ] Implement email verification for user registration

## 🐛 Troubleshooting

### Cloudinary Upload Failures

**Issue**: 401 Unauthorized error
```bash
# Fix: Verify API credentials in .env file
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-correct-key
CLOUDINARY_API_SECRET=your-correct-secret
```

**Issue**: Upload preset not found
```bash
# Fix: Create the upload preset in Cloudinary console
# Or remove the NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET from .env
```

### Database Connection Issues

**Issue**: Connection timeouts
```bash
# Fix: Check DATABASE_URL format
# PostgreSQL: postgresql://user:password@host:port/database
```

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

## 🎉 You're Ready for Production!

Your Instagram clone is now configured with:
- ✅ Scalable cloud image storage via Cloudinary
- ✅ Production-ready database setup
- ✅ All features working (posts, stories, AI, etc.)
- ✅ Secure authentication with NextAuth.js

Deploy and start building your social media community! 🚀
