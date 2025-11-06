# Discord Clone Setup Guide - PostgreSQL with Supabase

## Migration from MySQL/PlanetScale to PostgreSQL/Supabase

This guide will help you set up the Discord clone project with PostgreSQL using Supabase instead of MySQL with PlanetScale.

## What We've Changed

1. ✅ **Prisma Schema**: Updated from `mysql` to `postgresql` provider
2. ✅ **Dependencies**: Added PostgreSQL driver (`postgres` package)
3. ✅ **Database Types**: Removed MySQL-specific `@db.Text` annotations
4. ✅ **Configuration**: Updated environment variable templates

## Step-by-Step Setup

### 1. Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `discord-clone` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to you
6. Wait for project to be created (usually 2-3 minutes)

### 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Copy the **URI** connection string
4. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 3. Create Environment File

1. Copy the content from `env-config.txt`
2. Create a new file called `.env` in the project root
3. Paste the content and fill in your actual values:

```bash
# Clerk Authentication (Get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase PostgreSQL Database
DATABASE_URL="postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres"

# UploadThing (Get from https://uploadthing.com)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

# LiveKit (Get from https://cloud.livekit.io)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://...
```

### 4. Setup Clerk Authentication

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Copy your publishable key and secret key
4. Update the `.env` file

### 5. Setup UploadThing (Optional - for file uploads)

1. Go to [https://uploadthing.com](https://uploadthing.com)
2. Create an account and project
3. Copy your API keys to `.env`

### 6. Setup LiveKit (Optional - for video calls)

1. Go to [https://cloud.livekit.io](https://cloud.livekit.io)
2. Create an account and project
3. Copy your API keys to `.env`

### 7. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) View your database in Supabase dashboard
npx prisma studio
```

### 8. Run the Application

```bash
npm run dev
```

Your app should now be running at `http://localhost:3000`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your DATABASE_URL is correct
   - Check if your Supabase project is active
   - Ensure your IP is not blocked (check Supabase dashboard)

2. **Prisma Errors**
   - Run `npx prisma generate` after any schema changes
   - Check if all environment variables are set correctly

3. **Authentication Issues**
   - Verify Clerk keys are correct
   - Check if Clerk application is properly configured

### Database Schema Changes

The main changes from MySQL to PostgreSQL:
- Removed `@db.Text` annotations (PostgreSQL handles text fields better)
- Removed `relationMode = "prisma"` (not needed for PostgreSQL)
- All string fields now use native PostgreSQL text type

## Next Steps

1. **Test the application** - Create a user account and test basic functionality
2. **Customize** - Modify the UI, add new features
3. **Deploy** - Deploy to Vercel, Netlify, or your preferred platform

## Support

If you encounter issues:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Check the [Prisma documentation](https://www.prisma.io/docs)
3. Check the [Clerk documentation](https://clerk.com/docs)

## Migration Complete! 🎉

Your Discord clone is now running on PostgreSQL with Supabase instead of MySQL with PlanetScale.
