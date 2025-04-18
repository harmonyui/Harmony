# Chat Bubble Feature

## Problem Statement

Users need a way to add contextual comments to specific elements in the Harmony editor through chat bubbles. This feature will enable better collaboration and communication about specific UI components directly within the editor interface.

## Requirements

### Functional Requirements

1. Users can create chat bubbles attached to specific DOM elements
2. Chat bubbles contain:
   - Text content (no character limit)
   - Position relative to the attached element (offsetX, offsetY)
   - Reference to the element they're attached to
   - Optional reference to the creating user
3. Chat bubbles are visible to all team members
4. Chat bubbles persist across sessions within the same branch
5. Chat bubbles are removed when their referenced element is deleted
6. Both authenticated and anonymous users can create chat bubbles

### Non-Functional Requirements

1. Chat bubbles should be lightweight and not impact editor performance
2. Database operations should be optimized for quick read/write
3. UI should be responsive and update immediately after chat bubble creation/deletion

## Design Decisions

### Database Schema

```prisma
model ChatBubble {
  id         String   @id @default(cuid())
  branch_id  String
  branch     Branch   @relation(fields: [branch_id], references: [id])
  element_id String
  content    String
  offset_x   Float
  offset_y   Float
  account_id String?
  account    Account? @relation(fields: [account_id], references: [id])
  created_at DateTime @default(now())
}
```

### API Routes

1. New endpoints in editor router (`packages/server/src/api/routers/editor.ts`):
   - `createChatBubble`: Create a new chat bubble
   - `updateChatBubble`: Update existing chat bubble
   - `deleteChatBubble`: Remove a chat bubble
   - Extend `loadProject` to include chat bubbles

## Technical Design

### 1. Core Components

1. **Database Layer**

   - New ChatBubble model in Prisma schema
   - Relations to Branch and Account models
   - Indexes on branch_id and element_id for efficient queries

2. **API Layer**

   - New TRPC procedures in editor router
   - Input validation schemas for chat bubble operations
   - Integration with existing authentication system

3. **State Management**

   - Chat bubbles will be loaded with initial project data
   - Add chatBubbles to HarmonyStore for local state management
   - Server state synchronization on changes
   - New state slice for managing comment mode and active comment creation

4. **UI Components**
   - Comment mode toggle in HarmonyToolbar
   - Custom cursor using ChatTeardrop icon when in comment mode
   - Comment input dialog for entering comment content
   - Comment bubble component for displaying comments

### 2. Integration Points

1. **Editor Router**

   ```typescript
   // New procedures to add
   getChatBubbles: (branchId: string) => ChatBubble[]
   createChatBubble: (data: CreateChatBubbleInput) => ChatBubble
   updateChatBubble: (data: UpdateChatBubbleInput) => ChatBubble
   deleteChatBubble: (id: string) => void
   ```

2. **Load Project Integration**
   - Extend loadProject response to include chatBubbles array
   - Include chat bubbles in initial state management setup

### 3. Comment Creation Flow

1. **Entering Comment Mode**

   ```typescript
   // New context properties in HarmonyContext
   interface HarmonyContextProps {
     isComment: boolean;
     onToggleComment: () => void;
     // ... existing props
   }
   ```

2. **Mode Handling**

   - When comment mode is toggled ON:
     - Ensure editor mode is active (call `onToggleInspector` if needed)
     - Change cursor to chat teardrop icon
     - Enable comment placement click handler
   - When comment mode is toggled OFF:
     - Reset cursor to default
     - Disable comment placement click handler
     - Cancel any in-progress comment creation

3. **Comment Creation Process**

   - User clicks on a component in comment mode
   - System captures:
     - Selected component from HarmonyStore
     - Click position relative to component's top-left corner
     - Round offsetX and offsetY to nearest whole number
   - Show comment input dialog
   - On dialog submit:
     - Call `createComment` method with:
       ```typescript
       interface CreateCommentInput {
         branchId: string;
         componentId: string;
         content: string;
         offsetX: number;
         offsetY: number;
       }
       ```
   - On dialog cancel/click away:
     - Clean up any temporary state
     - Keep comment mode active

4. **Data Layer Integration**

   ```typescript
   // New method in data layer
   interface DataLayerState {
     createComment: (input: CreateCommentInput) => Promise<ChatBubble>;
     // ... existing methods
   }
   ```

5. **Store Integration**
   ```typescript
   interface HarmonyState {
     chatBubbles: ChatBubble[];
     addChatBubble: (bubble: ChatBubble) => void;
     removeChatBubble: (id: string) => void;
     // ... existing state
   }
   ```

### 4. UI/UX Considerations

1. **Cursor Management**

   - Use ChatTeardrop icon as custom cursor in comment mode
   - Apply cursor style through CSS:
     ```css
     .comment-mode {
       cursor:
         url("path-to-chat-teardrop.svg") 16 16,
         auto;
     }
     ```

2. **Comment Input Dialog**

   - Modal dialog with text input
   - Submit and cancel buttons
   - Click-away behavior to cancel
   - Maintains position relative to clicked location

3. **Visual Feedback**
   - Highlight targetable elements when in comment mode
   - Show preview of where comment will be placed
   - Smooth transitions between states

## Implementation Progress

### Completed

1. ✅ Database Schema

   - Added ChatBubble model to Prisma schema
   - Added relations to Branch and Account models
   - Added indexes for performance optimization
   - Generated Prisma client with new model

2. ✅ Types and Validation Schemas

   - Added ChatBubble type and schema
   - Added CreateChatBubbleRequest type and schema
   - Added UpdateChatBubbleRequest type and schema
   - Updated LoadResponse to include chat bubbles

3. ✅ Repository Layer

   - Created chat repository with CRUD operations
   - Added prisma to domain model conversion
   - Added proper type safety and validation

4. ✅ TRPC Procedures

   - Added createChatBubble endpoint
   - Added updateChatBubble endpoint
   - Added deleteChatBubble endpoint
   - Updated loadProject to include chat bubbles
   - Integrated with chat repository methods

5. ✅ UI State Management

   - Added isComment toggle to HarmonyContext
   - Added onToggleComment handler
   - Added chat bubble state to HarmonyStore
   - Integrated comment mode with editor state

### In Progress

1. 🔄 UI Components
   - Comment mode toggle in HarmonyToolbar
   - Custom cursor for comment mode
   - Comment input dialog
   - Chat bubble display component

### Todo

1. Testing
   - Unit tests
   - Integration tests
   - Manual testing

## Testing Checklist

1. **Unit Tests**

   - Chat bubble CRUD operations
   - Input validation
   - Error handling
   - Authentication integration

2. **Integration Tests**

   - Database operations
   - API endpoint functionality
   - LoadProject integration
   - Element deletion cascade

3. **Manual Tests**
   - Chat bubble creation workflow
   - Position accuracy
   - Anonymous vs authenticated creation
   - Multi-user visibility
   - Element deletion handling

## Future Considerations

### Potential Enhancements

1. Rich text support in chat bubbles
2. Chat bubble threading/replies
3. Notification system for new chat bubbles
4. Chat bubble search/filtering
5. Export/import chat bubbles
6. Real-time collaboration features

### Known Limitations

1. No edit history
2. No markdown support
3. No rich media support
4. No private chat bubbles
5. No role-based access control
6. Single element attachment only

## Dependencies

### Runtime Dependencies

- Existing Prisma setup
- TRPC router infrastructure
- Authentication system
- Existing branch management

### Development Dependencies

- Prisma CLI for migrations
- Testing framework
- TypeScript for type definitions
