# Workspaces Feature

## Problem Statement

Currently, teams in Harmony are structured to have multiple repositories, but in practice, each team only uses one repository. This creates unnecessary complexity in the data model and UI. We need to introduce a workspace concept that better reflects the actual usage pattern while maintaining flexibility for future multi-repository scenarios.

## Requirements

### Functional Requirements

1. Teams should have multiple workspaces
2. Each workspace should have exactly one repository
3. Users should be able to switch between workspaces via a popover in the sidenav
4. Users should be able to create new workspaces
5. Users should be able to rename existing workspaces
6. The current workspace should be visible in the sidenav
7. URLs should include workspace ID (e.g., `/{workspaceId}/projects`)
8. Default workspace redirection for legacy URLs
9. Repository setup should be part of the workspace creation flow

### Non-Functional Requirements

1. Smooth migration from current repository-based structure
2. Minimal disruption to existing functionality
3. Maintainable and extensible codebase
4. Consistent user experience

## Design Decisions

### Data Model Changes

1. Introduce new `Workspace` model in Prisma schema (`packages/db/prisma/schema.prisma`)
2. Move repository relationship from Team to Workspace
3. Maintain one-to-one relationship between Workspace and Repository
4. Preserve creation dates during migration (`packages/db/prisma/migrations`)

### UI/UX Decisions

1. Use popover component for workspace switching (`packages/ui/src/components/core/popover.tsx`)
2. Show current workspace name in sidenav
3. Display checkmark for active workspace
4. Allow workspace creation and renaming
5. Implement URL-based workspace context
6. Refactor repository setup UI from `apps/dashboard/app/setup/components/setup.tsx` for use in workspace creation

## Technical Design

### 1. Core Components

#### Database Schema

```prisma
model Workspace {
  id            String     @id @default(cuid())
  name          String
  team_id       String
  team          Team       @relation(fields: [team_id], references: [id])
  repository    Repository @relation(fields: [repository_id], references: [id])
  repository_id String     @unique
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
}
```

#### Migration Strategy

1. Create new Workspace model
2. For each team:
   - Create a workspace named "{account.firstName}'s Workspace" (or "Person's Workspace" if no accounts)
   - Move repository relationship to workspace
3. Update existing queries to use workspace context

### 2. Integration Points

#### Service Layer Changes

1. New workspace service functions:
   - createWorkspace
   - updateWorkspace
   - getWorkspacesForTeam (used in server components)
   - getCurrentWorkspace (used in server components for URL redirects)

#### UI Components

1. WorkspaceSwitcher component using Popover (client component)
2. WorkspaceCreationModal (client component)
   - Repository setup flow (refactored from `setup.tsx`)
   - GitHub integration
   - Repository selection
   - Additional repository configuration (branch, default URL, CSS framework)
3. WorkspaceRenameModal (client component)
4. Updated routing structure with server components for workspace context

## Implementation Plan

1. Database Changes

   - Create migration script
   - Update Prisma schema
   - Test migration on development database

2. Service Layer Implementation

   - Create workspace service functions
   - Update existing services to use workspace context
   - Add workspace middleware for server components

3. UI Implementation

   - [x] Create workspace switcher component
     - [x] Basic structure
     - [x] Workspace list display
     - [x] Current workspace indicator
     - [x] Create workspace button
     - [x] Navigation between workspaces
   - [x] Integrate with SidePanel
     - [x] Add workspaceSwitcher prop
     - [x] Mobile and desktop layouts
   - [x] Implement workspace creation modal
     - [x] Repository setup flow (refactored from `setup.tsx`)
     - [x] GitHub integration
     - [x] Repository selection
     - [x] Additional repository configuration
   - [ ] Update routing structure with server components
   - [ ] Add workspace context provider for client components

4. Testing
   - Unit tests for new components
   - Integration tests for API changes
   - Migration testing
   - End-to-end testing

## Current Progress

### Completed

- [x] Basic UI components (Popover, Button, Icons)
- [x] WorkspaceSwitcher component implementation
- [x] SidePanel integration with workspace switcher
- [x] Basic navigation structure
- [x] Repository setup flow component
- [x] Workspace creation modal with integrated repository setup
- [x] Select component for CSS framework selection
- [x] Repository setup flow with three steps:
  - Git repository connection
  - Repository information (branch, default URL, CSS framework)
  - Editor setup instructions

### In Progress

- [ ] API endpoints implementation
- [ ] Workspace creation flow
- [ ] Repository setup integration
- [ ] Database schema and migrations
- [ ] Installation of @radix-ui/react-select package

### Next Steps

1. Install required dependencies

   - Add @radix-ui/react-select to UI package
   - Update package.json and lock files

2. Implement API endpoints for workspaces

   - Create workspace service functions
   - Add workspace middleware for server components
   - Update existing services to use workspace context

3. Create database schema and migrations

   - Add Workspace model to Prisma schema
   - Create migration script
   - Test migration on development database

4. Add workspace settings page
5. Implement workspace deletion
6. Add workspace repository association
7. Update project creation to include workspace selection
8. Add workspace-level permissions
9. Implement workspace sharing

## Notes

- Workspace switcher has been moved to the dashboard app to avoid Next.js dependency in the UI package
- Side panel has been updated to support the workspace switcher component
- Basic navigation between workspaces is implemented
- Repository setup flow has been refactored into a reusable component
- Select component has been added to the UI package for CSS framework selection
- Next step is to install dependencies and implement the API endpoints

## Testing Checklist

1. **Unit Tests**

   - WorkspaceSwitcher component
   - WorkspaceCreationModal
   - WorkspaceRenameModal
   - API endpoints

2. **Integration Tests**

   - Workspace switching
   - Workspace creation
   - Workspace renaming
   - URL routing

3. **Manual Tests**
   - Migration process
   - Workspace switching
   - URL navigation
   - Error handling

## Future Considerations

### Potential Enhancements

1. Workspace-specific settings
2. Workspace templates
3. Workspace sharing
4. Workspace analytics

### Known Limitations

1. One repository per workspace
2. No workspace-level permissions
3. Basic workspace management features
4. Repository setup must be completed during workspace creation

## Dependencies

### Runtime Dependencies

1. Prisma
2. Next.js
3. Radix UI (for popover)
4. React Router

### Development Dependencies

1. TypeScript
2. Jest
3. React Testing Library
