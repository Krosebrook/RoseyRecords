# Contributing to HarmoniQ

Thank you for your interest in contributing to HarmoniQ! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database access
- API keys for AI services (for full functionality)

### Getting Started

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   Create a `.env` file with required variables (see README.md)

3. **Initialize Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
harmoniq/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   └── pages/          # Page components
├── server/                 # Backend (Express)
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Database operations
├── shared/                 # Shared code
│   └── schema.ts           # Database schema
└── docs/                   # Documentation
```

## Code Conventions

### TypeScript
- Use TypeScript for all new code
- Define types in `shared/schema.ts` for database models
- Use Zod for runtime validation

### React Components
- Use functional components with hooks
- Follow the existing component patterns in `client/src/components`
- Use shadcn/ui components when possible
- Add `data-testid` attributes to interactive elements

### Styling
- Use Tailwind CSS utility classes
- Follow the existing color scheme (CSS variables in `index.css`)
- Use responsive breakpoints: `sm:`, `md:`, `lg:`
- Avoid inline styles unless necessary

### API Routes
- Keep routes thin - business logic in storage layer
- Validate input with Zod schemas
- Return consistent response formats
- Use proper HTTP status codes

## Making Changes

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commits:
- `feat: add audio visualizer`
- `fix: handle empty audio sources`
- `docs: update API documentation`
- `refactor: simplify storage interface`

### Code Style
- Run Prettier before committing
- Follow existing patterns in the codebase
- Add comments for complex logic

## Testing

### Manual Testing
- Test all user flows after changes
- Check responsive layouts at different screen sizes
- Verify API endpoints with different inputs

### Adding Test IDs
Add `data-testid` to elements for automated testing:
```tsx
<Button data-testid="button-submit">Submit</Button>
<input data-testid="input-email" />
```

## Database Changes

### Schema Updates
1. Modify `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update storage interface if needed

### Important Rules
- Never change primary key types
- Add new columns with defaults or make them nullable
- Test migrations on a copy before production

## Adding New Features

### New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation item in sidebar if needed

### New API Endpoint
1. Define types in `shared/schema.ts`
2. Add storage method in `server/storage.ts`
3. Create route in `server/routes.ts`

### New AI Integration
1. Add API client in `server/replit_integrations/`
2. Create route endpoints
3. Add frontend UI for interaction

## Documentation

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying architecture
- Updating dependencies

### Files to Update
- `README.md` - Setup and overview
- `docs/API.md` - API endpoint documentation
- `docs/ARCHITECTURE.md` - System design
- `docs/CHANGELOG.md` - Version history
- `replit.md` - Project context

## Questions?

If you have questions about contributing:
1. Check existing documentation
2. Look at similar code in the codebase
3. Open an issue for discussion

Thank you for contributing to HarmoniQ!
