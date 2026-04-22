<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            if ($order->status === 'cancelled') return false;
            if ($order->payment_method === 'cash') {
                return $order->status === 'completed';
            }
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

        $order = Order::findOrFail($id);
        $oldStatus = $order->status;
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
        
        $updates = ['status' => $request->status];

        // Assign queue position if cash order gets accepted into kitchen
        if ($oldStatus === 'pending' && $request->status === 'preparing') {
            $activeOrdersCount = Order::whereIn('status', ['preparing', 'serving'])->count();
            $updates['queue_position'] = $activeOrdersCount + 1;
            $updates['accepted_at'] = now();
        }

        $order->update($updates);

        // Recalculate queue positions when an order is completed
        if ($request->status === 'completed') {
            $this->recalculateQueuePositions();
        }

        // Restore stock when an order is cancelled (only when transitioning INTO cancelled)
        if ($request->status === 'cancelled' && $oldStatus !== 'cancelled') {
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }
        }

        $order->load('items.product');

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
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
}
