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
        $summary = [
            'today' => $this->getSummaryForPeriod(now()->startOfDay()),
            'week' => $this->getSummaryForPeriod(now()->subDays(7)->startOfDay()),
            'month' => $this->getSummaryForPeriod(now()->subDays(30)->startOfDay()),
        ];

        $query = Order::with('items.product')->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $orders = $query->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
            'summary' => $summary,
        ]);
    }

    /**
     * Helper to get summary statistics for a period starting from $startDate.
     */
    private function getSummaryForPeriod($startDate): array
    {
        $sales = Order::where('created_at', '>=', $startDate)
            ->where(function ($query) {
                $query->where('payment_method', '!=', 'cash')
                      ->where('status', '!=', 'cancelled')
                      ->orWhere(function ($q) {
                          $q->where('payment_method', 'cash')
                            ->where('status', 'completed');
                      });
            })->sum('total');

        return [
            'sales' => $sales,
            'orders' => Order::where('created_at', '>=', $startDate)->count(),
            'completed' => Order::where('status', 'completed')->where('created_at', '>=', $startDate)->count(),
            'cancelled' => Order::where('status', 'cancelled')->where('created_at', '>=', $startDate)->count(),
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
