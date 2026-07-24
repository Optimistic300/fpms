<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Document $document): bool
    {
        if ($document->published) {
            return true;
        }

        return app(ProjectPolicy::class)->hasAccess($user, $document->project);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Document $document): bool
    {
        if ($user->id === $document->uploaded_by) {
            return true;
        }

        return app(ProjectPolicy::class)->isOwner($user, $document->project);
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->id === $document->uploaded_by) {
            return true;
        }

        return app(ProjectPolicy::class)->isOwner($user, $document->project);
    }

    public function download(User $user, Document $document): bool
    {
        return $this->view($user, $document);
    }
}
