<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Burgers
            [
                'name' => 'Classic Smash Burger',
                'description' => 'Juicy smashed beef patty with melted cheese, pickles, and our special sauce on a toasted brioche bun.',
                'price' => 149.00,
                'category' => 'Burgers',
                'image' => '/images/burger_mockup_1776713677164.png',
            ],
            [
                'name' => 'Double Stack Burger',
                'description' => 'Two smashed beef patties, double cheese, caramelized onions, and crispy bacon.',
                'price' => 199.00,
                'category' => 'Burgers',
                'image' => '/images/burger_mockup_1776713677164.png',
            ],
            [
                'name' => 'Spicy Jalapeño Burger',
                'description' => 'Beef patty with jalapeño peppers, pepper jack cheese, and spicy mayo.',
                'price' => 169.00,
                'category' => 'Burgers',
                'image' => '/images/burger_mockup_1776713677164.png',
            ],
            [
                'name' => 'Mushroom Swiss Burger',
                'description' => 'Sautéed mushrooms, Swiss cheese, and garlic aioli on a premium beef patty.',
                'price' => 179.00,
                'category' => 'Burgers',
                'image' => '/images/burger_mockup_1776713677164.png',
            ],

            // Sides
            [
                'name' => 'Crispy Fries',
                'description' => 'Golden, perfectly salted French fries. Crispy on the outside, fluffy inside.',
                'price' => 79.00,
                'category' => 'Sides',
                'image' => '/images/fries_mockup_1776713697084.png',
            ],
            [
                'name' => 'Onion Rings',
                'description' => 'Beer-battered onion rings, fried to a golden crunch. Served with ranch dip.',
                'price' => 89.00,
                'category' => 'Sides',
                'image' => '/images/fries_mockup_1776713697084.png',
            ],
            [
                'name' => 'Chicken Nuggets',
                'description' => '8-piece crispy chicken nuggets with your choice of dipping sauce.',
                'price' => 99.00,
                'category' => 'Sides',
                'image' => '/images/fries_mockup_1776713697084.png',
            ],

            // Drinks
            [
                'name' => 'Iced Tea',
                'description' => 'Refreshing house-brewed iced tea with lemon. Sweetened to perfection.',
                'price' => 49.00,
                'category' => 'Drinks',
                'image' => '/images/drink_mockup_1776713780721.png',
            ],
            [
                'name' => 'Mango Shake',
                'description' => 'Creamy mango milkshake made with real Philippine mangoes.',
                'price' => 89.00,
                'category' => 'Drinks',
                'image' => '/images/drink_mockup_1776713780721.png',
            ],
            [
                'name' => 'Coca-Cola Float',
                'description' => 'Classic Coca-Cola with a scoop of creamy vanilla ice cream.',
                'price' => 69.00,
                'category' => 'Drinks',
                'image' => '/images/drink_mockup_1776713780721.png',
            ],

            // Desserts
            [
                'name' => 'Chocolate Lava Cake',
                'description' => 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
                'price' => 129.00,
                'category' => 'Desserts',
                'image' => '/images/dessert_mockup_1776713794304.png',
            ],
            [
                'name' => 'Churros',
                'description' => 'Crispy cinnamon-sugar churros with chocolate and caramel dipping sauces.',
                'price' => 99.00,
                'category' => 'Desserts',
                'image' => '/images/dessert_mockup_1776713794304.png',
            ],
        ];

        foreach ($products as $product) {
            $product['stock'] = 50; // Give initial stock
            Product::updateOrCreate(
                ['name' => $product['name']],
                $product
            );
        }
    }
}
