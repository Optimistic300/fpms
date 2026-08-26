<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        try {
            $result = $action->execute(
                $request->input('email'),
                $request->input('password')
            );
        } catch (ValidationException $e) {
            if (str_contains($e->getMessage(), 'deactivated')) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Contact an administrator.',
                ], 403);
            }

            return response()->json([
                'message' => 'Invalid email or password.',
                'errors' => ['email' => ['Invalid email or password.']],
            ], 422);
        }

        return response()->json([
            'data' => array_merge(
                (new UserResource($result['user']))->toArray($request),
                ['token' => $result['token']]
            ),
        ]);
    }

    public function logout(Request $request, LogoutAction $action): JsonResponse
    {
        $action->execute($request->user());

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function validateToken(Request $request): JsonResponse
    {
        $user = $request->user()->load('division');

        return response()->json([
            'data' => array_merge(
                (new UserResource($user))->toArray($request),
                ['valid' => true]
            ),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If the email exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->password = bcrypt($password);
                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password reset successful.',
            ]);
        }

        return response()->json([
            'message' => 'Invalid or expired reset token.',
            'errors' => ['email' => [__($status)]],
        ], 422);
    }
}
