<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $key = 'login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Too many login attempts. Please try again in ' . RateLimiter::availableIn($key) . ' seconds.',
            ], 429);
        }

        $user = User::with('division')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'Invalid email or password.',
                'errors' => ['email' => ['Invalid email or password.']],
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Contact an administrator.',
            ], 403);
        }

        RateLimiter::clear($key);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'userId' => $user->id,
                'fullName' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'division' => $user->division?->name,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function validateToken(Request $request): JsonResponse
    {
        $user = $request->user()->load('division');

        return response()->json([
            'data' => [
                'valid' => true,
                'userId' => $user->id,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'division' => $user->division?->name,
            ],
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // In v1, we use Laravel's built-in password reset notification
        // For API, we'd trigger the notification here
        // $request->user()->sendPasswordResetNotification(...);

        return response()->json([
            'message' => 'If the email exists, a password reset link has been sent.',
        ]);
    }
}
