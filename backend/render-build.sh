#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Building Laravel Project ---"

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
# Note: Ensure DB_CONNECTION and other DB variables are set in Render environment
php artisan migrate --force

# Cache settings for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "--- Build Complete ---"
