# Contributing to Fuinnosho

Thank you for your interest in contributing to Fuinnosho! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/fuinnosho.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `pnpm test`
6. Commit your changes
7. Push to your fork and submit a pull request

## Development Setup

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

```bash
pnpm install
cp .env.example .env.local
# Configure your .env.local
pnpm dev
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Keep components focused and single-purpose

### Formatting

The project uses Prettier for formatting. Run before committing:

```bash
pnpm format
```

### Linting

```bash
pnpm lint
```

## Testing

- Write tests for new features
- Ensure existing tests pass before submitting a PR
- Unit tests use Vitest
- E2E tests use Playwright

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README if you've added features
4. Link any related issues in your PR description
5. Wait for review and address any feedback

### PR Title Format

Use clear, descriptive titles:
- `feat: add bulk film import`
- `fix: correct expiration date calculation`
- `docs: update setup instructions`
- `refactor: simplify film form validation`

## Reporting Bugs

When reporting bugs, please include:
- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information if relevant
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Please:
- Check existing issues first
- Describe the use case
- Explain why it would be valuable

## Database Changes

If your contribution requires database changes:
1. Create a new migration file in `supabase/migrations/`
2. Use the naming format: `YYYYMMDDHHMMSS_description.sql`
3. Document the changes in your PR
4. Do NOT run migrations automatically - maintainers will handle this

## Questions?

Feel free to open an issue for questions or join discussions.

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.
