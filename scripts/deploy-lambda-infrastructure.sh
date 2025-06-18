#!/bin/bash

# Deploy Lambda functions and infrastructure to AWS
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
S3_BUCKET="synvya-subscriptions-prod"
ZAPRITE_API_KEY="${ZAPRITE_API_KEY}"

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

# Deploy CloudFormation stack
echo "☁️ Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file aws-lambda-infrastructure.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ZapriteApiKey="$ZAPRITE_API_KEY" \
        S3BucketName="$S3_BUCKET" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset

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

echo ""
echo "📝 Next steps:"
echo "1. Update your frontend to use the new Lambda URLs instead of Netlify functions"
echo "2. Update Zaprite webhook URL to point to the PaymentWebhookUrl"
echo "3. Test all functionality to ensure everything works correctly" 