# Open Source Preparation Plan

This document outlines the steps needed to prepare Fuinnosho for open-sourcing, along with potential monetization strategies for a paid cloud version.

---

## Critical Security Fixes (Must Do Before Publishing)

### 1. Remove Hardcoded MCP API Key
- **File:** `mcp-server.ts:17`
- **Issue:** Fallback API key is exposed in source code
- **Fix:** Remove the fallback, make it environment-only:
  ```typescript
  // Before
  apiKey: process.env.MCP_MONITORING_API_KEY || "mcp_72a8f9177ddf..."

  // After
  apiKey: process.env.MCP_MONITORING_API_KEY
  ```

### 2. Remove Hardcoded User ID
- **File:** `mcp-server.ts:225`
- **Issue:** Specific user UUID hardcoded
- **Fix:** Make configurable via environment variable or implement proper auth:
  ```typescript
  // Before
  this.userId = "335461ec-7719-4c39-b023-c600e11d308c";

  // After
  this.userId = process.env.MCP_USER_ID || "";
  ```

### 3. Create `.env.example`
Create a new file with all required environment variables (no actual values):
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for film recommendations)
OPENAI_API_KEY=your-openai-key

# API Security
FILM_API_SECRET=your-api-secret

# MCP Server (optional, for Claude Desktop integration)
MCP_MONITORING_API_KEY=your-mcp-key
MCP_MONITORING_ENDPOINT=your-monitoring-endpoint
MCP_USER_ID=your-user-uuid
```

### 4. Check Git History
Scan for accidentally committed secrets:
```bash
git log -p | grep -i "api_key\|secret\|password" | head -50
```

---

## Documentation Needed

### High Priority

| Document | Description | Status |
|----------|-------------|--------|
| `README.md` | Project overview, features, screenshots, quick start | Currently boilerplate |
| `CONTRIBUTING.md` | How to contribute, code style, PR process | Missing |
| `docs/SETUP.md` | Detailed local development setup | Missing |
| `LICENSE` | Choose and add license file | Missing |

### Medium Priority

| Document | Description | Status |
|----------|-------------|--------|
| `docs/ARCHITECTURE.md` | System design, component structure | Missing |
| `docs/DATABASE.md` | Schema documentation, ERD diagram | Missing |
| `docs/API.md` | REST endpoint documentation | Missing |
| `docs/DEPLOYMENT.md` | Vercel, self-hosted deployment guides | Missing |

---

## Code Cleanup Tasks

### Authentication Middleware
- **File:** `src/middleware.ts:40-42`
- **Issue:** Auth middleware is commented out
- **Action:** Either re-enable or document why it's disabled for development

### MCP Server Documentation
- Update `README-MCP.md` with clearer setup instructions for new users
- Add troubleshooting section

### Test Coverage
- Current: ~559 unit tests, good coverage on business logic
- Missing: Component tests, API route tests
- Consider adding test coverage badge to README

---

## License Recommendation

**Recommended: AGPL-3.0**

Reasons:
- Protects against competitors hosting your code as a service without contributing back
- Still allows personal and commercial use
- Community-friendly for a niche tool like this
- Used by: GitLab, Grafana, MongoDB

Alternative options:
- **MIT** - Maximum adoption, minimal protection
- **Apache 2.0** - Good patent protection, permissive
- **BSL (Business Source License)** - Time-delayed open source

---

## Monetization Strategy: Paid Cloud Version

### Tier Structure

#### Free (Self-Hosted / Open Source)
- Full film inventory management
- Gear tracking
- Trip planning with film reservations
- Chemistry and development tracking
- Basic usage analytics
- All data stored locally/self-hosted Supabase

#### Cloud Basic (~$5-10/month)
- Hosted database (no Supabase setup required)
- Automatic daily backups
- Cloud sync across devices
- Progressive Web App for mobile

#### Cloud Pro (~$15-20/month)
- Everything in Basic, plus:
- **AI Film Recommendations** (OpenAI-powered, costs absorbed)
- **Advanced Analytics** (shooting patterns, cost analysis, predictions)
- **Pre-configured MCP/Claude Integration**
- Film scanning metadata integration
- Lab integration features
- Priority email support

#### Team/Studio (~$30-50/month)
- Everything in Pro, plus:
- Multi-user accounts
- Shared inventory and trip planning
- Gear lending/checkout tracking
- Team analytics and reporting
- Export features for client reports

### Revenue Opportunities

1. **Convenience** - Many film photographers aren't technical; hosted version removes friction
2. **AI Costs** - OpenAI API has per-use costs you can absorb in subscription
3. **MCP Integration** - Complex to set up; pre-configured is valuable
4. **Community** - Film photography is a passionate niche; people support tools they love

---

## Implementation Checklist

### Phase 1: Security & Basics
- [ ] Remove hardcoded API key from `mcp-server.ts`
- [ ] Remove hardcoded user ID from `mcp-server.ts`
- [ ] Create `.env.example` file
- [ ] Add `LICENSE` file (AGPL-3.0 recommended)
- [ ] Scan git history for secrets
- [ ] Review/re-enable auth middleware

### Phase 2: Documentation
- [ ] Rewrite `README.md` with proper project description
- [ ] Add feature list with screenshots
- [ ] Write setup/installation instructions
- [ ] Create `CONTRIBUTING.md`
- [ ] Document database schema

### Phase 3: Polish
- [ ] Add CI/CD badges to README
- [ ] Set up GitHub issue templates
- [ ] Create PR template
- [ ] Add code of conduct
- [ ] Set up GitHub discussions for community

### Phase 4: Launch
- [ ] Create GitHub release
- [ ] Write launch blog post / announcement
- [ ] Share on film photography communities
- [ ] Set up hosted version landing page

---

## Current Codebase Strengths

Things already in good shape:
- Strong TypeScript typing throughout
- Well-structured Next.js 15 App Router architecture
- Comprehensive test suite (559+ tests)
- Good separation of concerns
- Radix UI for accessibility
- Row Level Security in database
- Existing documentation of bugs and TODOs

---

## Notes

This plan was created during a Claude Code session. The analysis included:
- Full codebase exploration
- Security audit of configuration files
- Review of existing documentation
- Assessment of test coverage
- Evaluation of monetization opportunities

For questions or to continue this work, reference:
- `APP_TODOS.md` - Existing prioritized task list
- `BUGS.md` - Known bugs documentation
- `CLAUDE.md` - Development guidelines for Claude
