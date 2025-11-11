# Agent Instructions for switch-click

## Commands
- **Build**: `npm run build`
- **Dev server**: `npm run dev` (runs on port 6923)
- **Lint**: `npm run lint`
- **Type check**: `npx tsc --noEmit`
- **No test framework configured**

## Code Style
- **TypeScript**: Strict mode enabled, explicit types for state/props
- **React**: Functional components with hooks, 'use client' for client components
- **Imports**: Relative paths for local files, @/ alias for absolute imports
- **Naming**: PascalCase for components, camelCase for files/functions, kebab-case for CSS modules
- **Formatting**: Single quotes, no semicolons, 2-space indentation
- **Styling**: Tailwind CSS classes, CSS modules for complex styles
- **Error handling**: Console.error for async operations, null checks for optional data
- **Async**: async/await pattern with proper error handling