#!/bin/bash

# Deploy Lambda functions and infrastructure to AWS
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
S3_BUCKET="synvya-subscriptions-prod"
ZAPRITE_API_KEY="${ZAPRITE_API_KEY}"
TEMPLATE_FILE="$(pwd)/aws-lambda-infrastructure.yml"

echo "🚀 Deploying Synvya Lambda Infrastructure..."

# Check if required environment variables are set
if [ -z "$ZAPRITE_API_KEY" ]; then
    echo "❌ Error: ZAPRITE_API_KEY environment variable is required"
    echo "Please set it with: export ZAPRITE_API_KEY=your_api_key"
    exit 1
fi

# Build Lambda functions
echo "📦 Building Lambda functions..."
./scripts/build-lambda-functions.sh

# Upload Lambda function packages to S3
echo "⬆️ Uploading Lambda functions to S3..."
aws s3 sync build/lambda-functions/ s3://$S3_BUCKET/lambda-functions/ --delete

echo "☁️ Deploying CloudFormation stack..."
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --parameter-overrides \
    ZapriteApiKey="$ZAPRITE_API_KEY" \
    S3BucketName="$S3_BUCKET" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

# Update Lambda function code directly (CloudFormation doesn't auto-update from S3)
echo "🔄 Updating Lambda function code..."
LAMBDA_FUNCTIONS=(
    "synvya-check-contact"
    "synvya-check-subscription" 
    "synvya-create-zaprite-order"
    "synvya-get-order"
    "synvya-get-user-orders"
    "synvya-payment-webhook"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    echo "  ↻ Updating $func..."
    # Extract function name from full function name (remove synvya- prefix)
    func_basename="${func#synvya-}"
    
    aws lambda update-function-code \
        --function-name "$func" \
        --s3-bucket "$S3_BUCKET" \
        --s3-key "lambda-functions/${func_basename}.zip" \
        --no-cli-pager || echo "⚠️ Failed to update $func (may not exist yet)"
done

# Get stack outputs
echo "📋 Getting deployment outputs..."
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output table

echo "🎉 Deployment completed successfully!"
echo ""
echo "🔗 Lambda Function URLs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?contains(OutputKey, `Url`)].{Function:OutputKey,URL:OutputValue}' \
    --output table

# Update the edge security headers function directly
echo "☁️ Updating CloudFront AddSecurityHeaders function…"

# Get the current ETag for the function from DEVELOPMENT stage
CURRENT_ETAG=$(aws cloudfront describe-function \
    --name AddSecurityHeaders \
    --stage DEVELOPMENT \
    --query 'ETag' \
    --output text)

# Update the function code
aws cloudfront update-function \
    --name AddSecurityHeaders \
    --if-match "$CURRENT_ETAG" \
    --function-config Comment="Add security headers to responses",Runtime="cloudfront-js-2.0" \
    --function-code fileb://cloudfront-security-headers.js

# Get the new ETag after update for publishing
echo "📢 Publishing new CloudFront function version..."
NEW_ETAG=$(aws cloudfront describe-function \
    --name AddSecurityHeaders \
    --stage DEVELOPMENT \
    --query 'ETag' \
    --output text)

# Publish the new version to LIVE
aws cloudfront publish-function \
    --name AddSecurityHeaders \
    --if-match "$NEW_ETAG"

echo "✅ CloudFront security headers function updated successfully"

echo ""
echo "📝 Next steps:"
echo "1. Update your frontend to use the new Lambda URLs instead of Netlify functions"
echo "2. Update Zaprite webhook URL to point to the PaymentWebhookUrl"
echo "3. Test all functionality to ensure everything works correctly"