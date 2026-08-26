<?php

namespace App\Listeners;

use App\Events\ActivityLogged;
use App\Models\InboxItem;
use App\Models\ProjectMember;

class NotifyProjectMembersOnActivity
{
    public function handle(ActivityLogged $event): void
    {
        $activity = $event->activity;
        $project = $activity->project;

        if (!$project) {
            return;
        }

        $memberIds = ProjectMember::where('project_id', $project->id)
            ->where('user_id', '!=', $activity->user_id)
            ->pluck('user_id');

        foreach ($memberIds as $memberId) {
            InboxItem::create([
                'user_id' => $memberId,
                'sender_id' => $activity->user_id,
                'type' => 'SYSTEM',
                'subject' => "New activity on {$project->title}",
                'message' => "{$activity->user->full_name} logged \"{$activity->type}\" on {$project->title}.",
            ]);
        }
    }
}
