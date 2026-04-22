<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PushSubscription;

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_number' => 'required|string',
            'endpoint' => 'required|string',
            'public_key' => 'nullable|string',
            'auth_token' => 'nullable|string',
        ]);

        $subscription = PushSubscription::updateOrCreate(
            ['endpoint' => $validated['endpoint']],
            [
                'order_number' => $validated['order_number'],
                'public_key' => $validated['public_key'],
                'auth_token' => $validated['auth_token'],
            ]
        );

        return response()->json(['message' => 'Subscription saved successfully.']);
    }
}
