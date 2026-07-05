# WF13 — AI Assistant

## Purpose
Global overlay providing retrieval-augmented Q&A over the library's documents. Every answer cites its sources.

## Entry Points
- Gold floating button (bottom-right, bottom-left on mobile)
- Library search "Ask SKMS" button (from no-results state)
- Follow-up prompt chips in AI panel

## Component Lifecycle
- Mounted at app root level. Never unmounts.
- State persists across all route changes.
- Page behind dims when open (`rgba(0,0,0,0.18)`, `pointer-events: none` on page behind).
- On mobile: takes full screen width when open.

## States

### Closed
Gold circular button, `position: fixed`, bottom-right (bottom-left on mobile <768px). On hover expands to show "Ask SKMS" label.

### Open
Panel slides in from right edge. Close button (X) in panel header → slides out, dim lifts, scroll position preserved.

## Panel Header
- Gold sparkle icon
- "Ask SKMS" title
- Subtitle: "Searches across all library documents · always cites sources"
- Close button (X)
- "New conversation" button — small text button, clears conversation history

## Conversation Area
- User messages: dark bubble, right-aligned
- Assistant messages: light bubble, left-aligned

## Empty State (No Conversation Yet)
Three suggested prompt chips:
1. "What has FORIG found about [user's division research area]?"
2. "Which projects are researching [topic]?"
3. "What reports have been submitted on [topic]?"

Clicking a chip → populates input and submits immediately.

## Sending a Message
- Enter submits. Shift+Enter for newline.
- Input disabled while response loading.
- `POST /api/ai/query { query, conversationHistory: [...] }`
- While waiting: typing indicator (three animated dots) in light bubble on left.

## Response Rendering
Parse response text for citation markers [1], [2] etc. Render each as small numbered badge inline in text.
Below response text: citation cards in order:
- Number badge
- Document title
- Author, division, file type, page number
- External link icon — click → `GET /api/documents/:id/preview` → opens inline viewer. Panel stays open behind viewer.

### Honest-Limits Banner
Renders below citation cards on every single response. Never conditional, never dismissible:
> "This answer draws only from FORIG's own library. It is not a literature review. For published external research use Google Scholar or Web of Science."

### Follow-Up Prompt Chips
Three chips below banner, suggested by backend based on query topic. Clicking a chip populates input and submits.

## When Library Cannot Answer
Backend returns `{ canAnswer: false, message: "The library does not contain enough information to answer this." }`.
Render message as assistant response. No citations. Honest-limits banner still shows.
Follow-up chips: "Browse the library →" (navigates to `/library`) and "Try different terms →" (clears input and focuses it).

## New Conversation
Clears `conversationHistory` array in state. Clears all messages. Returns to empty state with suggested prompt chips.

## Edge Cases
- **API timeout:** show error in assistant bubble: "Something went wrong. Please try again." Retry button re-sends the last message.
- **Panel open on mobile:** full screen width. Close button always reachable.
- **User navigates while panel open:** panel stays open, page behind changes, conversation preserved.

## API Contract
See `06-ai-assistant.md` for a full deep-dive on the AI assistant's retrieval mechanism, indexing pipeline, and citation model.
