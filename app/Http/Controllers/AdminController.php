<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\User;
use App\Models\ActivityType;
use App\Policies\AdminPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $users = User::with('division')->orderBy('created_at', 'desc')->paginate(50);

        $users->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'division' => $user->division?->name,
                'isActive' => $user->is_active,
                'createdAt' => $user->created_at?->toIso8601String(),
            ];
        });

        return response()->json(['data' => $users->items()]);
    }

    public function createUser(Request $request): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'fullName' => 'required|string|max:255',
            'role' => 'required|in:RESEARCHER,STUDENT,SECRETARY,DIVISION_HEAD,MANAGEMENT,ADMIN',
            'divisionId' => 'required|exists:divisions,id',
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'full_name' => $validated['fullName'],
            'avatar_initials' => strtoupper(substr($validated['fullName'], 0, 2)),
            'role' => $validated['role'],
            'division_id' => $validated['divisionId'],
            'is_active' => true,
        ]);

        return response()->json(['data' => $user], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $validated = $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'fullName' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:RESEARCHER,STUDENT,SECRETARY,DIVISION_HEAD,MANAGEMENT,ADMIN',
            'divisionId' => 'sometimes|exists:divisions,id',
            'isActive' => 'sometimes|boolean',
            'password' => 'sometimes|string|min:8',
        ]);

        $update = [];
        if (isset($validated['email'])) $update['email'] = $validated['email'];
        if (isset($validated['fullName'])) {
            $update['full_name'] = $validated['fullName'];
            $update['avatar_initials'] = strtoupper(substr($validated['fullName'], 0, 2));
        }
        if (isset($validated['role'])) $update['role'] = $validated['role'];
        if (isset($validated['divisionId'])) $update['division_id'] = $validated['divisionId'];
        if (isset($validated['isActive'])) $update['is_active'] = $validated['isActive'];
        if (isset($validated['password'])) $update['password'] = Hash::make($validated['password']);

        $user->update($update);

        return response()->json(['data' => $user->fresh()->load('division')]);
    }

    public function divisions(Request $request): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $divisions = Division::with('head')->get()->map(fn($d) => [
            'id' => $d->id,
            'name' => $d->name,
            'headName' => $d->head?->full_name,
        ]);

        return response()->json(['data' => $divisions]);
    }

    public function createDivision(Request $request): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:divisions,name',
            'headId' => 'nullable|exists:users,id',
        ]);

        $division = Division::create([
            'name' => $validated['name'],
            'head_id' => $validated['headId'] ?? null,
        ]);

        return response()->json(['data' => $division], 201);
    }

    public function activityTypes(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ActivityType::orderBy('name')->get()->map(fn($at) => [
                'id' => $at->id,
                'name' => $at->name,
                'slug' => $at->slug,
            ]),
        ]);
    }

    public function createActivityType(Request $request): JsonResponse
    {
        app(AdminPolicy::class)->manageUsers($request->user()) || abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:activity_types,slug',
        ]);

        $activityType = ActivityType::create($validated);

        return response()->json(['data' => $activityType], 201);
    }
}
