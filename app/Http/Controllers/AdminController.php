<?php

namespace App\Http\Controllers;

use App\Actions\Admin\CreateActivityTypeAction;
use App\Actions\Admin\CreateDivisionAction;
use App\Actions\Admin\CreateUserAction;
use App\Actions\Admin\DeleteActivityTypeAction;
use App\Actions\Admin\DeleteDivisionAction;
use App\Actions\Admin\ListActivityTypesAction;
use App\Actions\Admin\ListDivisionsAction;
use App\Actions\Admin\ListUsersAction;
use App\Actions\Admin\UpdateActivityTypeAction;
use App\Actions\Admin\UpdateDivisionAction;
use App\Actions\Admin\UpdateUserAction;
use App\Http\Requests\StoreActivityTypeRequest;
use App\Http\Requests\StoreDivisionRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateActivityTypeRequest;
use App\Http\Requests\UpdateDivisionRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\ActivityTypeResource;
use App\Http\Resources\BaseResource;
use App\Http\Resources\DivisionResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityType;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(Request $request, ListUsersAction $action): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = $action->execute($request);
        $collection = UserResource::collection($users->items());

        return response()->json(BaseResource::paginated($users, $collection));
    }

    public function createUser(StoreUserRequest $request, CreateUserAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $action->execute($request->validated());

        return response()->json(['data' => new UserResource($user)], 201);
    }

    public function updateUser(UpdateUserRequest $request, User $user, UpdateUserAction $action): JsonResponse
    {
        $this->authorize('update', $user);

        $user = $action->execute($user, $request->validated());

        return response()->json(['data' => new UserResource($user)]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update(['password' => bcrypt($validated['password'])]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function divisions(Request $request, ListDivisionsAction $action): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $divisions = $action->execute();

        return response()->json(['data' => DivisionResource::collection($divisions)]);
    }

    public function createDivision(StoreDivisionRequest $request, CreateDivisionAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $division = $action->execute($request->validated());

        return response()->json(['data' => new DivisionResource($division)], 201);
    }

    public function updateDivision(UpdateDivisionRequest $request, Division $division, UpdateDivisionAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $division = $action->execute($division, $request->validated());

        return response()->json(['data' => new DivisionResource($division)]);
    }

    public function deleteDivision(Request $request, Division $division, DeleteDivisionAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $action->execute($division);

        return response()->json(['message' => 'Division deleted successfully.']);
    }

    public function activityTypes(Request $request, ListActivityTypesAction $action): JsonResponse
    {
        $activityTypes = $action->execute();

        return response()->json(['data' => ActivityTypeResource::collection($activityTypes)]);
    }

    public function createActivityType(StoreActivityTypeRequest $request, CreateActivityTypeAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $activityType = $action->execute($request->validated());

        return response()->json(['data' => new ActivityTypeResource($activityType)], 201);
    }

    public function updateActivityType(UpdateActivityTypeRequest $request, ActivityType $activityType, UpdateActivityTypeAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $activityType = $action->execute($activityType, $request->validated());

        return response()->json(['data' => new ActivityTypeResource($activityType)]);
    }

    public function deleteActivityType(Request $request, ActivityType $activityType, DeleteActivityTypeAction $action): JsonResponse
    {
        $this->authorize('create', User::class);

        $action->execute($activityType);

        return response()->json(['message' => 'Activity type deleted successfully.']);
    }
}
