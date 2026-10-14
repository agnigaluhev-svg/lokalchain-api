<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users()
    {
        $users = User::orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    // Satu-satunya jalan membuat akun KUD
    public function createKud(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'role' => 'kud',
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Akun KUD dibuat.',
            'user' => $user,
        ], 201);
    }

    public function setActive(Request $request, User $user)
    {
        abort_if($user->id === $request->user()->id, 422, 'Anda tidak dapat menonaktifkan akun sendiri.');
        abort_if($user->role === 'admin', 403, 'Akun admin tidak dapat diubah lewat endpoint ini.');

        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $user->update(['is_active' => $validated['is_active']]);

        // Nonaktif berarti semua sesi login akun itu langsung dicabut
        if (!$validated['is_active']) {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $validated['is_active'] ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.',
        ]);
    }
}