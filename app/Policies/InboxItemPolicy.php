<?php

namespace App\Policies;

use App\Models\InboxItem;
use App\Models\User;

class InboxItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, InboxItem $inboxItem): bool
    {
        return $user->id === $inboxItem->user_id;
    }

    public function update(User $user, InboxItem $inboxItem): bool
    {
        return $user->id === $inboxItem->user_id;
    }
}
