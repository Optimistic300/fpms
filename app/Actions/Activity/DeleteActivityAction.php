<?php

namespace App\Actions\Activity;

use App\Models\Activity;
use Illuminate\Support\Facades\Storage;

class DeleteActivityAction
{
    public function execute(Activity $activity): int
    {
        $docCount = $activity->documents()->count();

        foreach ($activity->documents as $doc) {
            Storage::disk('local')->delete($doc->file_path);
            $doc->delete();
        }

        $activity->delete();

        return $docCount;
    }
}
