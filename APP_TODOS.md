# Fuinnosho Application TODOs

## 🔴 CRITICAL PRIORITY (Fix Immediately)

### Security Issues
- [ ] **Remove hardcoded API key** in `mcp-server.ts:17`
  - Remove: `"mcp_72a8f9177ddf0bab9d3001e49e20294ea05b1959b076edff4455fc8d34db50c3"`
  - Ensure key is only in environment variables and never committed

- [ ] **Fix hardcoded user ID** in `mcp-server.ts:225`
  - Remove: `this.userId = "335461ec-7719-4c39-b023-c600e11d308c";`
  - Implement proper user authentication instead

- [ ] **Re-enable authentication middleware** in `src/middleware.ts:40-42`
  - Uncomment authentication checks or implement alternative protection
  - Current state leaves protected routes accessible without login

- [ ] **Add authentication to API routes**
  - `src/app/api/fix-bulk-exposures/route.ts` - Add auth check at beginning
  - `src/app/api/debug-bulk-films/route.ts` - Add auth check at beginning
  - Pattern: Verify user authentication before any database operations

- [ ] **Add UUID validation to delete operations** in `src/app/actions/films.ts`
  - Functions: `deleteFilm`, `restoreFilm`, `permanentlyDeleteFilm`
  - Add: `z.string().uuid().parse(id)` validation
  - Prevents malformed database queries

## 🟠 HIGH PRIORITY (Fix This Week)

### Data Integrity Issues
- [ ] **Fix race condition in bulk film spooling** in `src/app/actions/films.ts:339-371`
  - Wrap read → calculate → update operations in database transaction
  - Use atomic operations or row-level locking
  - Prevents incorrect calculations during concurrent operations

- [ ] **Fix unsafe type casting** in `src/app/actions/gear.ts:135`
  - Replace `any` type with proper interface
  - Define specific types for reservation objects
  - Restore TypeScript type safety

- [ ] **Fix silent cookie errors** in `src/lib/supabase/server.ts:20-24`
  - Add proper error logging for cookie setting failures
  - Implement fallback mechanisms for session management
  - Don't silently ignore authentication errors

### Input Validation
- [ ] **Add input validation to API routes**
  - All routes in `src/app/api/*/route.ts`
  - Use Zod schemas to validate request bodies and parameters
  - Return proper error responses for invalid input

- [ ] **Add input length limits** to film schema in `src/lib/utils.ts:140-158`
  - Add maximum length constraints: `z.string().min(1).max(255)` for names
  - Add: `z.string().max(2000)` for notes fields
  - Prevents database overflow and memory issues

## 🟡 MEDIUM PRIORITY (Fix This Month)

### Code Quality
- [ ] **Remove production debug endpoints**
  - Delete `src/app/api/debug-bulk-films/route.ts` or add strict access controls
  - Review all debug/development-only endpoints
  - Ensure no internal data exposure in production

- [ ] **Add transaction wrapping for multi-step operations** in `src/app/actions/films.ts`
  - Identify all operations that modify multiple tables
  - Wrap in Supabase transactions for consistency
  - Implement proper rollback on errors

- [ ] **Add error boundaries to major components**
  - Most components except `src/components/films/films-client-wrapper.tsx`
  - Wrap page sections in error boundaries
  - Provide user-friendly error displays

- [ ] **Fix memory leak potential** in `src/components/usage/usage-overview.tsx:31-86`
  - Add cleanup for async operations in useEffect
  - Use AbortController or cleanup functions
  - Prevent memory leaks on component unmount

### Error Handling
- [ ] **Standardize error handling patterns**
  - Some functions return error objects, others throw exceptions
  - Choose consistent pattern across application
  - Document error handling conventions

- [ ] **Improve error context** in server actions
  - Multiple files in `src/app/actions/`
  - Include more specific error information
  - Avoid exposing sensitive data in error messages

## 🟢 LOW PRIORITY (Technical Debt)

### Cleanup
- [ ] **Remove console logs from production code**
  - `src/middleware.ts:25` and other locations
  - Replace with proper logging system
  - Use environment-based logging levels

- [ ] **Fix test environment credentials** in `.env.test`
  - Replace placeholder values with clearly fake ones
  - Add validation to prevent accidental production use
  - Use values like `REPLACE_WITH_REAL_VALUE`

- [ ] **Clean up unused imports and variables**
  - Review all TypeScript files for unused code
  - Remove dead code and redundant imports
  - Improve build performance

### Performance
- [ ] **Add database constraints for concurrent operations**
  - Add triggers or constraints to prevent negative `bulk_remaining_exposures`
  - Implement database-level validation for critical business rules
  - Reduce reliance on application-level validation alone

### Monitoring
- [ ] **Implement proper application monitoring**
  - Set up structured logging system
  - Add performance monitoring
  - Create alerts for critical errors

- [ ] **Add comprehensive testing**
  - Unit tests for critical business logic
  - Integration tests for database operations
  - End-to-end tests for user workflows

---

## Notes

- **File paths are absolute** for easy navigation in IDE
- **Priority levels** indicate urgency, not necessarily difficulty
- **Security issues** should be addressed before any production deployment
- **Some items may be intentionally disabled** during development - verify before enabling

## Review Schedule

- **Daily**: Check critical items
- **Weekly**: Review high priority items
- **Monthly**: Address medium priority items
- **Quarterly**: Clean up low priority technical debt