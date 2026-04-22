<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class AdminController extends Controller
{
    /**
     * List all orders with optional status filter.
     */
    public function index(Request $request): JsonResponse
    {
        // Get the oldest date we need for any summary (30 days ago)
        $startDate = now()->subDays(30)->startOfDay();
        
        // Fetch only necessary columns for the summary to save memory
        $summaryOrders = Order::where('created_at', '>=', $startDate)
            ->select('id', 'total', 'status', 'payment_method', 'created_at')
            ->get();

        $summary = [
            'today' => $this->calculateSummary($summaryOrders, now()->startOfDay()),
            'week' => $this->calculateSummary($summaryOrders, now()->subDays(7)->startOfDay()),
            'month' => $this->calculateSummary($summaryOrders, $startDate),
        ];

        $query = Order::with('items.product')->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Limit the number of orders in the list to prevent massive JSON responses
        $orders = $query->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
            'summary' => $summary,
        ]);
    }

    /**
     * Calculate summary statistics from a collection of orders.
     */
    private function calculateSummary($orders, $sinceDate): array
    {
        $filtered = $orders->where('created_at', '>=', $sinceDate);
        
        $sales = $filtered->filter(function ($order) {
            // Do not count cancelled or pending orders as sales
            if (in_array($order->status, ['cancelled', 'pending'])) {
                return false;
            }
            
            // For cash orders, we only count sales once they are accepted into the kitchen (preparing)
            // For cashless (Maya/GCash), they start at 'preparing' so they are counted immediately
            return true;
        })->sum('total');

        return [
            'sales' => (float)$sales,
            'orders' => $filtered->count(),
            'completed' => $filtered->where('status', 'completed')->count(),
            'cancelled' => $filtered->where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Update an order's status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,serving,completed,cancelled',
            'pin' => 'nullable|string|size:6',
        ]);

        try {
            // Fetch order BEFORE starting transaction to "warm up" the connection
            $order = Order::with('items.product')->findOrFail($id);
            $oldStatus = $order->status;
            $newStatus = $request->status;

            if ($oldStatus === $newStatus) {
                return response()->json(['success' => true, 'data' => $order]);
            }

            return DB::transaction(function () use ($request, $order, $newStatus, $oldStatus) {

                $isTerminalCurrent = in_array($oldStatus, ['completed', 'cancelled']);

                // Require PIN ONLY for unlocking terminal orders (undoing finalized states)
                if ($isTerminalCurrent) {
                    $managerPin = env('MANAGER_PIN', '123456');
                    if ($request->pin !== (string)$managerPin) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Manager PIN required to unlock this finalized order.',
                        ], 403);
                    }
                }
                
                // Handle Stock Adjustments
                // 1. Moving TO cancelled: Restore stock
                if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                    foreach ($order->items as $item) {
                        if ($item->product) {
                            $item->product->increment('stock', $item->quantity);
                        }
                    }
                }
                
                // 2. Moving FROM cancelled: Check and Reduce stock
                if ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                    foreach ($order->items as $item) {
                        if (!$item->product) continue;
                        
                        // Check if enough stock is available to re-activate
                        if ($item->product->stock < $item->quantity) {
                            throw new \Exception("Insufficient stock for {$item->product->name} ({$item->product->stock} available). Cannot re-activate order.");
                        }
                        
                        $item->product->decrement('stock', $item->quantity);
                    }
                }

                $updates = ['status' => $newStatus];

                // Assign queue position if cash order gets accepted into kitchen
                if ($oldStatus === 'pending' && $newStatus === 'preparing') {
                    $activeOrdersCount = Order::whereIn('status', ['preparing', 'serving'])->count();
                    $updates['queue_position'] = $activeOrdersCount + 1;
                    $updates['accepted_at'] = now();
                }

                $order->update($updates);

                // Recalculate queue positions when an order is completed
                if ($newStatus === 'completed') {
                    $this->recalculateQueuePositions();
                }

                return $order;
            });

            // Send push notification in the BACKGROUND after the response is sent to the admin
            if ($newStatus === 'serving') {
                dispatch(function () use ($order) {
                    $this->sendPushNotification($order);
                })->afterResponse();
            }

            return response()->json([
                'success' => true,
                'data' => $order->fresh('items.product'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Recalculate queue positions for active orders.
     */
    private function recalculateQueuePositions(): void
    {
        $activeOrders = Order::whereIn('status', ['preparing', 'serving'])
            ->orderBy('created_at')
            ->get();

        foreach ($activeOrders as $index => $order) {
            $order->update(['queue_position' => $index + 1]);
        }
    }

    /**
     * Send Web Push Notification to the customer.
     */
    private function sendPushNotification(Order $order): void
    {
        try {
            // Safety check: If the migration hasn't been run yet, skip push notifications
            if (!\Schema::hasTable('push_subscriptions')) {
                return;
            }

            $pushSubscriptions = PushSubscription::where('order_number', $order->order_number)->get();

            if ($pushSubscriptions->isEmpty()) {
                return;
            }

            // Use config() with env() fallbacks for better stability
            $auth = [
                'VAPID' => [
                    'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
                    'publicKey' => env('VAPID_PUBLIC_KEY'),
                    'privateKey' => env('VAPID_PRIVATE_KEY'),
                ],
            ];

            // If keys are missing, we can't send push
            if (!$auth['VAPID']['publicKey'] || !$auth['VAPID']['privateKey']) {
                \Log::warning('WebPush keys are missing in .env. Skipping notification.');
                return;
            }

            $webPush = new WebPush($auth);

            foreach ($pushSubscriptions as $pushSub) {
                $subscription = Subscription::create([
                    'endpoint' => $pushSub->endpoint,
                    'publicKey' => $pushSub->public_key,
                    'authToken' => $pushSub->auth_token,
                ]);

                $webPush->queueNotification(
                    $subscription,
                    json_encode([
                        'title' => 'Your Order is Ready! 🍽️',
                        'body' => "Order #{$order->order_number} is now being served. Please proceed to the counter.",
                        'url' => "/order/{$order->order_number}",
                    ]),
                    ['TTL' => 2419200, 'urgency' => 'high'] // 4 weeks TTL, High Urgency for screen-off delivery
                );
            }

            foreach ($webPush->flush() as $report) {
                if (!$report->isSuccess()) {
                    if ($report->isSubscriptionExpired()) {
                        try {
                            PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                        } catch (\Exception $e) { /* ignore */ }
                    }
                }
            }
        } catch (\Exception $e) {
            // Log the error but never crash the main request
            \Log::error('Push notification system error: ' . $e->getMessage());
        }
    }
}
