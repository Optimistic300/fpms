<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForwardDocumentRequest;
use App\Http\Requests\MarkReadAllRequest;
use App\Http\Resources\InboxItemResource;
use App\Models\InboxItem;
use App\Services\InboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    public function __construct(
        private readonly InboxService $inboxService
    ) {}

    public function index(Request $request): array
    {
        $this->authorize('viewAny', InboxItem::class);

        $items = $this->inboxService->getItemsForUser(
            $request->user(),
            $request->only(['type', 'read', 'limit', 'page'])
        );

        $result = InboxItemResource::paginated($items, InboxItemResource::collection($items));
        $result['meta']['unreadCount'] = $this->inboxService->getUnreadCount($request->user());

        return $result;
    }

    public function markRead(Request $request, InboxItem $inboxItem): JsonResponse
    {
        $this->authorize('view', $inboxItem);

        $item = $this->inboxService->markAsRead($inboxItem->id, $request->user());

        return response()->json([
            'data' => ['id' => $item->id, 'read' => $item->read],
        ]);
    }

    public function markAllRead(MarkReadAllRequest $request): JsonResponse
    {
        $this->authorize('viewAny', InboxItem::class);

        $count = $this->inboxService->markAllAsRead(
            $request->user(),
            $request->validated('ids')
        );

        return response()->json([
            'message' => "{$count} items marked as read.",
        ]);
    }

    public function forward(ForwardDocumentRequest $request): JsonResponse
    {
        $this->authorize('viewAny', InboxItem::class);

        $this->inboxService->forwardDocument(
            documentId: (int) $request->validated('document_id'),
            sender: $request->user(),
            recipientIds: $request->validated('recipient_ids'),
            message: $request->validated('message')
        );

        $count = count($request->validated('recipient_ids'));

        return response()->json([
            'message' => "Document forwarded to {$count} recipients.",
        ], 201);
    }
}
