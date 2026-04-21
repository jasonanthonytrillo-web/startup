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
                    $product = Product::findOrFail($item['product_id']);
                    
                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Insufficient stock for {$product->name}. Only {$product->stock} available.");
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
                'message' => 'Failed to create order: ' . $e->getMessage(),
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
            ->with('items.product')
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
