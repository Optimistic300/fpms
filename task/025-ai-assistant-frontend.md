# Task 025: AI Assistant Frontend

**Status:** Not Started
**Depends on:** 006, 024
**Docs referenced:** `docs/05-screens/13-ai-assistant.md`, `docs/06-ai-assistant.md`

## Objective

Build the AI Assistant frontend (WF13) — a global overlay panel accessible via a floating gold button. Users can ask plain-language questions, receive cited answers from the library, and follow up with suggested prompts. The panel persists across all route changes.

## Context

The AI Assistant ("Ask SKMS") is a global feature accessible from any authenticated page. The gold floating button is always visible. Clicking it opens a right slide-in panel with conversation UI. Every answer cites its source documents and shows an honest-limits banner. The panel stays open and preserves conversation state during navigation.

## Scope

**In scope:**
- Floating gold button (fixed position, bottom-right, hover to expand)
- AI panel (slide-in from right, page dims behind, close button)
- Conversation UI: user messages (right/dark), assistant messages (left/light)
- Empty state with three suggested prompt chips
- Message input with Enter to submit, Shift+Enter for newlines, disabled while loading
- Typing indicator (three dots) while waiting for response
- Response rendering: citation markers `[1]`, `[2]` as inline badges, citation cards below response
- Honest-limits banner on every response (non-dismissible)
- Follow-up prompt chips below banner
- New conversation button (clears history)
- Error state on API timeout with retry button
- Offline indicator + queued questions (UI only — queuing behavior is Task 027)

**Out of scope:**
- Document preview inline viewer (Task 021 — referenced from citation clicks)
- Library search "Ask SKMS" button navigation (Task 021 — already wired)

## Relevant API contract

### `POST /api/ai/query`
See Task 024 for full contract.

## Relevant frontend behavior

### Closed State
Gold circle button, bottom-right (bottom-left on mobile <768px). Hover → width expands, "Ask SKMS" label fades in.

### Open State
Panel slides in from right edge. Close button (X) in header. Page behind dims (`rgba(0,0,0,0.18)`), `pointer-events: none` on page content. On mobile (<768px): full screen width.

### Panel Header
Gold sparkle icon, "Ask SKMS" title, subtitle "Searches across all library documents · always cites sources", Close (X), "New conversation" small text button.

### Conversation Area
- User messages: dark bubble, right-aligned
- Assistant messages: light bubble, left-aligned

### Empty State
Three suggested prompt chips (dynamic based on user's division/research area):
1. "What has FORIG found about [division research area]?"
2. "Which projects are researching [topic]?"
3. "What reports have been submitted on [topic]?"
Click → populates input and submits immediately.

### Sending a Message
Enter to submit. Shift+Enter for newline. Input disabled while loading. Typing indicator (three animated dots) in light bubble.

### Response Rendering
Parse `[1]`, `[2]` markers as numbered inline badges. Below: citation cards (number, title, author, division, file type, page). Click → `GET /api/documents/:id/preview` → opens inline viewer behind panel.

### Honest-Limits Banner
Below citation cards on every response. Never conditional, never dismissible.

### Cannot Answer
Render message as assistant response. No citations. Honest-limits banner still shows. Follow-ups: "Browse the library" (→ `/library`), "Try different terms" (clears input, focuses).

### Offline
Gold button visible with subtle offline indicator. Click → message: "Ask SKMS requires an internet connection. Your questions will be saved and answered when you reconnect."

## Architectural conventions that apply

- Panel persists across route changes (mounted at app root, not inside route)
- Conversation state in AIContext (not localStorage — lost on page reload for v1)
- Citation markers parsed client-side using regex
- `POST /api/ai/query` receives full conversation history each request (stateless backend)
- Typing indicator is purely cosmetic (no streaming for v1)
- DOMPurify sanitizes any HTML in response text (though v1 returns plain text with `[N]` markers)

## Step-by-step implementation checklist

- [ ] Update `FloatingAIButton.jsx` (from Task 006) with full hover animation and click → open panel
- [ ] Update `AIPanel.jsx` (from Task 006) with full UI:
  - Header with icon, title, subtitle, close, new conversation
  - Conversation message list
  - Empty state with suggested prompts
  - Input area with Enter/Shift+Enter
  - Typing indicator
  - Response rendering with citation badges and cards
  - Honest-limits banner
  - Cannot-answer state
  - Error state with retry
  - Offline message
- [ ] Create `resources/js/components/ai/MessageBubble.jsx` — user/assistant variants
- [ ] Create `resources/js/components/ai/CitationCard.jsx` — numbered card with document info, click → preview
- [ ] Create `resources/js/components/ai/HonestLimitsBanner.jsx` — non-dismissible banner component
- [ ] Create `resources/js/components/ai/SuggestedPrompts.jsx` — suggested prompt chips
- [ ] Create `resources/js/components/ai/TypingIndicator.jsx` — three animated dots
- [ ] Wire AIContext `openPanel`/`closePanel` to button and panel
- [ ] Implement query submission:
  - Build `conversationHistory` array from message list
  - POST to `/api/ai/query`
  - Handle response: render answer + citations + follow-ups
  - Handle 408 timeout: show error with retry
  - Handle other errors: show generic error with retry
- [ ] Implement citation click → navigate to document preview (open in new tab or inline)
- [ ] Implement offline detection: show offline indicator on button, show message in panel
- [ ] Style gold button: `position: fixed`, `z-index: 1000`, gold circle, hover expand
- [ ] Style panel: right slide-in, `z-index: 1001`, dim overlay
- [ ] Mobile: full width, button bottom-left

## Definition of done

- Gold floating button visible on all authenticated pages
- Click button → panel slides in from right, page dims
- Panel header shows title, subtitle, close, new conversation
- Empty state shows suggested prompts, clicking submits query
- User can type and submit messages
- Typing indicator shown while loading
- Response renders with citation markers as inline badges
- Citation cards show below response with document info
- Clicking citation card opens document preview
- Honest-limits banner shown on EVERY response
- Cannot answer state shows message + follow-ups
- API timeout shows error with retry button
- "New conversation" clears all messages and history
- Panel stays open during route changes
- Mobile: full width, button bottom-left
- Offline: button shows indicator, panel shows offline message
- All messages preserved in conversation history during panel session

## Open questions / assumptions inherited

- **Streaming not implemented for v1** — answers return as complete responses. Streaming can be added in a future version per `06-ai-assistant.md`.
- **LLM provider** is abstracted behind `AiRetrievalInterface` — the frontend is independent of which LLM is used.
- **Offline queuing** of questions is UI-only in this task. Full IndexedDB queuing is in Task 027.
