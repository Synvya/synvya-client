#!/bin/bash

# Build and package all Lambda functions for AWS deployment
set -e

echo "🔨 Building Lambda functions..."

# Create build directory
mkdir -p build/lambda-functions

# Function to build a single Lambda function
build_function() {
    local function_name=$1
    echo "📦 Building $function_name..."
    
    # Create temporary directory
    local temp_dir="build/temp-$function_name"
    mkdir -p "$temp_dir"
    
    # Copy function code and shared library
    cp -r "aws-lambda/$function_name"/* "$temp_dir/"
    cp -r "aws-lambda/lib" "$temp_dir/"
    
    # Install dependencies
    cd "$temp_dir"
    npm install --production
    
    # Create zip file
    zip -r "../lambda-functions/$function_name.zip" . -x "*.git*" "*.DS_Store*"
    
    # Return to root
    cd ../../..
    
    # Clean up temp directory
    rm -rf "$temp_dir"
    
    echo "✅ Built $function_name"
}

# Build all functions
build_function "check-subscription"
build_function "create-zaprite-order"
build_function "payment-webhook"
build_function "get-order"
build_function "get-user-orders"
build_function "check-contact"

echo "🎉 All Lambda functions built successfully!"
echo "📁 Built packages are in build/lambda-functions/" 