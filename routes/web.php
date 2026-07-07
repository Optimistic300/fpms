<?php

use Illuminate\Support\Facades\Route;

Route::get('/password/reset/{token}', function (string $token) {
    return response()->json(['token' => $token]);
})->name('password.reset');

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
