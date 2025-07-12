#!/bin/bash

# Deploy Lambda infrastructure to AWS with user records tracking
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
S3_BUCKET="synvya-user-records-prod"
TEMPLATE_FILE="$(pwd)/aws-lambda-infrastructure.yml"

echo "🚀 Deploying Synvya Lambda Infrastructure with User Records Tracking..."

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
    S3BucketName="$S3_BUCKET" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

# Update Lambda function code directly (CloudFormation doesn't auto-update from S3)
echo "🔄 Updating Lambda function code..."
LAMBDA_FUNCTIONS=(
    "synvya-record-terms-acceptance"
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

# Test the health endpoint
echo ""
echo "🏥 Testing health endpoint..."
HEALTH_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`HealthCheckUrl`].OutputValue' \
    --output text)

if [ -n "$HEALTH_URL" ]; then
    echo "Health URL: $HEALTH_URL"
    echo "Testing endpoint..."
    curl -s "$HEALTH_URL" | jq . || echo "curl or jq not available, health URL printed above"
else
    echo "⚠️ Could not retrieve health URL"
fi

echo ""
echo "📝 Next steps:"
echo "1. Update runtime-env.js to include the new function URLs"
echo "2. Terms acceptance is now recorded server-side for legal compliance"
echo "3. User signup records are stored in S3 bucket: $S3_BUCKET"