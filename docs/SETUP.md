# HarmoniQ Development Setup Guide

This guide walks you through setting up the HarmoniQ development environment.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **PostgreSQL**: Database (automatically provided on Replit)
- **Git**: For version control

## Environment Variables

HarmoniQ requires several environment variables to be configured. On Replit, many of these are automatically managed.

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `REPL_ID` | Replit application ID (auto-set) | Yes |
| `ISSUER_URL` | Replit OIDC issuer URL (auto-set) | Yes |

### AI Service Variables

| Variable | Description | Service |
|----------|-------------|---------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key | Lyrics generation |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL | Lyrics generation |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini API key | Song concepts |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Gemini base URL | Song concepts |
| `REPLICATE_API_KEY` | Replicate API key | MusicGen & Bark |
| `FAL_API_KEY` or `FAL_KEY` | fal.ai API key | Stable Audio |

### Setting Up API Keys on Replit

1. **OpenAI & Gemini**: These are automatically configured through Replit AI Integrations. No manual setup needed.

2. **Replicate API Key**:
   - Go to [replicate.com](https://replicate.com)
   - Create an account and navigate to API tokens
   - Copy your API token
   - In Replit, go to Secrets and add `REPLICATE_API_KEY`

3. **fal.ai API Key**:
   - Go to [fal.ai](https://fal.ai)
   - Create an account and get your API key
   - In Replit, go to Secrets and add `FAL_API_KEY` or `FAL_KEY`

## Database Setup

### On Replit

1. The PostgreSQL database is automatically created when you fork the project
2. The `DATABASE_URL` environment variable is automatically set
3. Database schema is defined in `shared/schema.ts`

### Pushing Schema Changes

When you modify the database schema:

```bash
npm run db:push
```

This uses Drizzle Kit to synchronize your schema with the database.

### Viewing the Database

Use the Replit Database pane to:
- View tables and data
- Run SQL queries
- Export data

## Running Locally

### Starting the Development Server

The application uses a single command to start both frontend and backend:

```bash
npm run dev
```

This starts:
- **Express server**: API routes and authentication
- **Vite dev server**: Frontend with hot module replacement

### Default Ports

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/*

The frontend and backend run on the same port through Vite's proxy configuration.

## Project Structure

```
harmoniq/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   └── services/           # External service integrations
├── shared/                 # Shared types and schemas
│   ├── schema.ts           # Database schema
│   └── routes.ts           # API contracts
├── docs/                   # Documentation
├── package.json            # Dependencies and scripts
└── replit.md              # Project documentation
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run check` | TypeScript type checking |

## Development Workflow

### 1. Making Frontend Changes

Frontend code is in the `client/` directory. Changes are automatically hot-reloaded.

```bash
# Edit a component
client/src/pages/Dashboard.tsx

# Changes appear immediately in browser
```

### 2. Making Backend Changes

Backend code is in the `server/` directory. The server automatically restarts on changes.

```bash
# Edit routes
server/routes.ts

# Server restarts automatically
```

### 3. Modifying the Database Schema

1. Edit `shared/schema.ts`
2. Run `npm run db:push`
3. Update `server/storage.ts` if adding new operations

### 4. Adding New Pages

1. Create the page component in `client/src/pages/`
2. Add the route in `client/src/App.tsx`
3. Add any backend routes needed in `server/routes.ts`

## Authentication

HarmoniQ uses Replit Auth via OpenID Connect. Authentication is automatically configured on Replit.

### Testing Authentication Locally

On Replit, authentication works automatically. For local development outside Replit, you would need to:

1. Set up an OIDC provider
2. Configure the `ISSUER_URL` and related variables
3. Handle the callback URLs

Note: Local development is typically done on Replit where auth is pre-configured.

## Troubleshooting

### Database Connection Issues

1. Check that `DATABASE_URL` is set correctly
2. Verify the database is running in the Replit Database pane
3. Try running `npm run db:push` to sync the schema

### API Key Errors

If you see "Service not configured" errors:

1. Verify the API key is set in Replit Secrets
2. Check the key name matches exactly (case-sensitive)
3. Restart the application after adding secrets

### Port Already in Use

If port 5000 is already in use:

1. Stop any other running processes
2. Use the Replit shell to check: `lsof -i :5000`
3. Kill the process: `kill -9 <PID>`

### Build Errors

1. Run `npm install` to ensure dependencies are installed
2. Run `npm run check` to see TypeScript errors
3. Check the console for specific error messages

## Feature Flags

Some features can be enabled/disabled based on environment:

- **Audio Generation**: Requires `REPLICATE_API_KEY` or `FAL_API_KEY`
- **AI Lyrics**: Requires OpenAI or Gemini integration
- **Singing Vocals**: Requires `REPLICATE_API_KEY`

If an API key is not configured, the corresponding feature will show a "not configured" message in the UI.

## Getting Help

- Check the [API Documentation](./API.md) for endpoint details
- Review the [Architecture Guide](./ARCHITECTURE.md) for system design
- Check `replit.md` for project-specific notes
