#!/bin/sh

# Seed the database if needed, otherwise just migrate
php artisan migrate --force --seed

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Apache
apache2-foreground
