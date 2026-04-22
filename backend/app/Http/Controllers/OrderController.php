<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Create a new order.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'order_type' => 'required|in:dine_in,take_out',
            'payment_method' => 'required|in:cash,maya,gcash',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            $order = DB::transaction(function () use ($request) {
                $status = $request->payment_method === 'cash' ? 'pending' : 'preparing';
                
                // Calculate queue position only if it skips straight to preparing
                $queuePosition = 0;
                if ($status === 'preparing') {
                    $activeOrders = Order::whereIn('status', ['preparing', 'serving'])->count();
                    $queuePosition = $activeOrders + 1;
                }

                $order = Order::create([
                    'order_number' => Order::generateOrderNumber(),
                    'customer_name' => $request->customer_name,
                    'order_type' => $request->order_type,
                    'payment_method' => $request->payment_method,
                    'queue_position' => $queuePosition,
                    'status' => $status,
                    'accepted_at' => $status === 'preparing' ? now() : null,
                ]);

                $total = 0;

                foreach ($request->items as $item) {
                    // Lock for update to prevent race conditions during stock check/decrement
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);
                    
                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Oops! Someone just grabbed the last of the {$product->name}. We only have {$product->stock} left in the kitchen. Please adjust your cart and try again!");
                    }

                    $itemTotal = $product->price * $item['quantity'];
                    $total += $itemTotal;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                    ]);

                    // Decrement stock
                    $product->decrement('stock', $item['quantity']);
                }

                $order->update(['total' => $total]);

                return $order;
            });

            $order->load('items.product');

            return response()->json([
                'success' => true,
                'data' => $order,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel an order (customer-initiated).
     * Only allowed if status is 'pending'.
     */
    public function cancel(string $orderNumber): JsonResponse
    {
        try {
            return DB::transaction(function () use ($orderNumber) {
                $order = Order::with('items.product')
                    ->where('order_number', $orderNumber)
                    ->lockForUpdate()
                    ->first();

                if (!$order) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Order not found.',
                    ], 404);
                }

                if ($order->status !== 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => "Order cannot be cancelled because it is already being {$order->status}.",
                    ], 400);
                }

                // Restore stock
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }

                $order->update(['status' => 'cancelled']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order cancelled successfully.',
                    'data' => $order,
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single order by order number.
     */
    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with('items.product')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Get the active queue (preparing + serving orders).
     */
    public function queue(): JsonResponse
    {
        $orders = Order::whereIn('status', ['preparing', 'serving'])
            ->select('id', 'order_number', 'customer_name', 'order_type', 'status', 'queue_position')
            ->with(['items' => function($query) {
                $query->select('id', 'order_id', 'product_id', 'quantity');
            }, 'items.product' => function($query) {
                $query->select('id', 'name');
            }])
            ->orderBy('queue_position')
            ->get();

        $preparing = $orders->where('status', 'preparing')->values();
        $serving = $orders->where('status', 'serving')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'preparing' => $preparing,
                'serving' => $serving,
                'total_active' => $orders->count(),
            ],
        ]);
    }
}
