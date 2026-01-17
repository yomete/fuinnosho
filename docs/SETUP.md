# Setup Guide

This guide covers setting up Fuinnosho for local development.

## Prerequisites

- **Node.js** 18 or higher
- **pnpm** (recommended) or npm
- **Supabase account** - [Sign up here](https://supabase.com)

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fuinnosho.git
cd fuinnosho
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### Get Your API Keys

1. Go to Project Settings > API
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Run Database Migrations

The database schema is defined in `supabase/migrations/`. You can either:

**Option A: Use Supabase CLI**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Option B: Run SQL Manually**

Copy the contents of each migration file (in order) into the Supabase SQL Editor and run them.

## 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Authentication (generate a random string)
FILM_API_SECRET=$(openssl rand -hex 32)

# Optional: OpenAI for film recommendations
OPENAI_API_KEY=your-openai-key

# Optional: MCP Server for Claude Desktop
MCP_MONITORING_API_KEY=your-mcp-key
MCP_USER_ID=your-user-uuid
```

## 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Create an Account

1. Navigate to `/register`
2. Create an account with email and password
3. Check your email for verification (if email confirmation is enabled in Supabase)

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
# Start the dev server first
pnpm dev

# In another terminal
pnpm test:e2e
```

## Common Issues

### "Missing Supabase environment variables"

Make sure your `.env.local` file exists and contains valid Supabase credentials.

### "Row level security policy violation"

Ensure you're logged in. All tables use Row Level Security - you can only access your own data.

### Database migration errors

Run migrations in order. Some migrations depend on earlier ones.

## Optional: MCP Server Setup

For Claude Desktop integration, see [README-MCP.md](../README-MCP.md).

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
pnpm build
pnpm start
```

## Next Steps

- Read [DATABASE.md](DATABASE.md) to understand the schema
- Check [../CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
