# Claude Development Guidelines

This document contains important guidelines and reminders for Claude when working on the Fuinnosho project.

## MCP Server Synchronization

**IMPORTANT**: Whenever a new feature is added or modified in the main application, always ensure the MCP server is updated to include the changes.

### Steps to Update MCP Server:

1. **Update Data Models**: Add new fields to the relevant interfaces in both:

   - `mcp-server.ts` (main MCP server)
   - `mcp-server-simple.ts` (simplified version)

2. **Update Tool Schemas**: Modify the tool input schemas to include new fields in:

   - `create_*` tools (for creating new records)
   - `edit_*` tools (for updating existing records)

3. **Update Handler Functions**: Ensure the handler functions properly process the new fields:

   - Extract new fields from function parameters
   - Include them in database operations
   - Handle them in the response data

4. **Rebuild MCP Server**: After making changes, rebuild the server:
   ```bash
   npx tsc --project tsconfig.mcp.json
   ```

### Common Areas That Need MCP Updates:

- **Film Management**: Any changes to film properties, fields, or functionality
- **Trip Planning**: Updates to trip structures or film/gear reservations
- **Gear Management**: Changes to gear properties or relationships
- **Usage Tracking**: Modifications to usage logging or history
- **Challenge Management**: Updates to challenge, prompt, or progress functionality

### Example Implementation:

When adding a new field like `editing_notes` to films:

1. Add to Film interface: `editing_notes?: string`
2. Add to create_film tool schema with appropriate description
3. Add to edit_film tool schema
4. Update createFilm function to handle the new field
5. Rebuild the server

This ensures Claude has access to all the latest features when working with your film inventory through the MCP interface.

## Testing and Validation

After updating the MCP server:

- Test the updated tools work correctly
- Verify new fields appear in responses
- Ensure backward compatibility is maintained
- Update any relevant documentation

## File Locations

- **Main MCP Server**: `/mcp-server.ts`
- **Simple MCP Server**: `/mcp-server-simple.ts`
- **TypeScript Config**: `/tsconfig.mcp.json`
- **Build Output**: `/dist/mcp-server.js`
- **Documentation**: `/README-MCP.md`

## GitHub

When committing file changes, please don't add yourself as a contributor in the commit message. Just describe the changes made.
