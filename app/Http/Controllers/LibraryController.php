<?php

namespace App\Http\Controllers;

use App\Actions\Library\DocumentsAction;
use App\Actions\Library\SearchAction;
use App\Actions\Library\StatsAction;
use App\Http\Requests\SearchLibraryRequest;
use App\Http\Resources\DocumentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    public function stats(Request $request, StatsAction $action): JsonResponse
    {
        $data = $action->execute();

        return response()->json(['data' => $data]);
    }

    public function documents(Request $request, DocumentsAction $action): JsonResponse
    {
        $result = $action->execute($request);

        return response()->json([
            'data' => DocumentResource::collection($result['documents']),
            'meta' => [
                'currentPage' => $result['documents']->currentPage(),
                'lastPage' => $result['documents']->lastPage(),
                'perPage' => $result['documents']->perPage(),
                'total' => $result['documents']->total(),
            ],
        ]);
    }

    public function search(SearchLibraryRequest $request, SearchAction $action): JsonResponse
    {
        $result = $action->execute($request);

        return response()->json([
            'data' => $result['documents'],
            'meta' => ['total' => $result['total']],
        ]);
    }
}
