<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Akun dinonaktifkan. Hubungi admin.'], 403);
        }

        if (!$user->hasRole(...$roles)) {
            return response()->json(['message' => 'Akses ditolak untuk peran Anda.'], 403);
        }

        return $next($request);
    }
}