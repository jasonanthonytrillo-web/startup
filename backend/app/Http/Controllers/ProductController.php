<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * List all available products, grouped by category.
     */
    public function index(): JsonResponse
    {
        $products = Product::where('available', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $grouped = $products->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $grouped,
        ]);
    }
}
