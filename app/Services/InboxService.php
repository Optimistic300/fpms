<?php

namespace App\Services;

use App\Events\DocumentForwarded;
use App\Models\InboxItem;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class InboxService
{
    public function createSystemAlert(User $user, string $subject, string $message, ?\App\Models\Report $report = null): InboxItem
    {
        return InboxItem::create([
            'user_id' => $user->id,
            'sender_id' => null,
            'type' => 'SYSTEM',
            'subject' => $subject,
            'message' => $message,
            'report_id' => $report?->id,
            'read' => false,
        ]);
    }
    public function getItemsForUser(User $user, array $filters): LengthAwarePaginator
    {
        $query = InboxItem::with(['sender.division', 'document', 'report'])
            ->where('user_id', $user->id);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['read'])) {
            $query->where('read', filter_var($filters['read'], FILTER_VALIDATE_BOOLEAN));
        }

        $limit = min((int) ($filters['limit'] ?? 20), 100);

        return $query->orderBy('created_at', 'desc')->paginate($limit);
    }

    public function getUnreadCount(User $user): int
    {
        return InboxItem::where('user_id', $user->id)->where('read', false)->count();
    }

    public function markAsRead(int $itemId, User $user): InboxItem
    {
        $item = InboxItem::where('id', $itemId)->where('user_id', $user->id)->firstOrFail();
        $item->update(['read' => true]);
        return $item;
    }

    public function markAllAsRead(User $user, ?array $ids = null): int
    {
        $query = InboxItem::where('user_id', $user->id)->where('read', false);

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $count = $query->count();
        $query->update(['read' => true]);

        return $count;
    }

    public function forwardDocument(int $documentId, User $sender, array $recipientIds, ?string $message = null): void
    {
        DocumentForwarded::dispatch($documentId, $sender, $recipientIds, $message);
    }
}
