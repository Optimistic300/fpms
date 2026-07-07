<?php

namespace App\Http\Controllers;

use App\Models\InboxItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InboxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = InboxItem::with(['sender', 'document', 'report'])
            ->where('user_id', $user->id);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('read')) {
            $query->where('read', $request->boolean('read'));
        }

        $limit = min((int) $request->limit, 100);
        $items = $query->orderBy('created_at', 'desc')->paginate($limit);

        $unreadCount = InboxItem::where('user_id', $user->id)->where('read', false)->count();

        $items->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'type' => $item->type,
                'subject' => $item->subject,
                'message' => $item->message,
                'sender' => $item->sender ? [
                    'fullName' => $item->sender->full_name,
                    'division' => $item->sender->division?->name,
                ] : null,
                'read' => $item->read,
                'documentId' => $item->document_id,
                'reportId' => $item->report_id,
                'createdAt' => $item->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'perPage' => $items->perPage(),
                'total' => $items->total(),
                'unreadCount' => $unreadCount,
            ],
        ]);
    }

    public function markRead(Request $request, InboxItem $inboxItem): JsonResponse
    {
        $this->authorize('view', $inboxItem);

        $inboxItem->update(['read' => true]);

        return response()->json([
            'data' => ['id' => $inboxItem->id, 'read' => true],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $query = InboxItem::where('user_id', $request->user()->id)->where('read', false);

        if ($request->filled('ids')) {
            $query->whereIn('id', $request->ids);
        }

        $count = $query->count();
        $query->update(['read' => true]);

        return response()->json([
            'message' => "{$count} items marked as read.",
        ]);
    }

    public function forward(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'documentId' => 'required|exists:documents,id',
            'recipientIds' => 'required|array',
            'recipientIds.*' => 'exists:users,id',
            'message' => 'nullable|string',
        ]);

        $document = \App\Models\Document::findOrFail($validated['documentId']);

        foreach ($validated['recipientIds'] as $recipientId) {
            InboxItem::create([
                'user_id' => $recipientId,
                'sender_id' => $request->user()->id,
                'type' => 'DOCUMENT',
                'subject' => 'Document forwarded: ' . $document->filename,
                'message' => $validated['message'],
                'document_id' => $document->id,
            ]);
        }

        $count = count($validated['recipientIds']);

        return response()->json([
            'message' => "Document forwarded to {$count} recipients.",
        ], 201);
    }
}
