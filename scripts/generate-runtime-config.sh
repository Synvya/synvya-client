#!/bin/bash

# Generate runtime-env.js with Lambda function URLs
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
OUTPUT_DIR="${1:-public}"

echo "🔧 Generating runtime-env.js configuration..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Get Lambda function URLs from CloudFormation stack outputs
echo "📡 Fetching Lambda function URLs from CloudFormation..."

# Get the stack outputs
HEALTH_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`HealthCheckUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

RECORD_TERMS_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`RecordTermsAcceptanceUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

CHECK_USER_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`CheckUserExistsUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

# Check if we got the URLs
if [ -z "$HEALTH_URL" ] || [ -z "$RECORD_TERMS_URL" ] || [ -z "$CHECK_USER_URL" ]; then
    echo "⚠️  Warning: Could not fetch all Lambda URLs from CloudFormation stack '$STACK_NAME'"
    echo "   Stack may not be deployed yet or outputs may be missing."
    echo "   Using placeholder values that will need manual update."
    
    # Generate runtime-env.js with placeholder values
    cat > "$OUTPUT_DIR/runtime-env.js" << 'EOF'
window.runtimeEnv = {
  healthUrl: 'TBD-AFTER-DEPLOYMENT',
  recordTermsAcceptanceUrl: 'TBD-AFTER-DEPLOYMENT',
  checkUserExistsUrl: 'TBD-AFTER-DEPLOYMENT'
};
EOF
else
    echo "✅ Successfully fetched Lambda URLs from CloudFormation"
    
    # Generate runtime-env.js with actual Lambda function URLs
    cat > "$OUTPUT_DIR/runtime-env.js" << EOF
window.runtimeEnv = {
  healthUrl: '$HEALTH_URL',
  recordTermsAcceptanceUrl: '$RECORD_TERMS_URL',
  checkUserExistsUrl: '$CHECK_USER_URL'
};
EOF
fi

echo "✅ Runtime configuration generated: $OUTPUT_DIR/runtime-env.js"
echo "📋 Lambda URLs configured:"
echo "   - healthUrl: ${HEALTH_URL:-'TBD-AFTER-DEPLOYMENT'}"
echo "   - recordTermsAcceptanceUrl: ${RECORD_TERMS_URL:-'TBD-AFTER-DEPLOYMENT'}"
echo "   - checkUserExistsUrl: ${CHECK_USER_URL:-'TBD-AFTER-DEPLOYMENT'}"
echo ""

if [ -z "$HEALTH_URL" ] || [ -z "$RECORD_TERMS_URL" ] || [ -z "$CHECK_USER_URL" ]; then
    echo "⚠️  IMPORTANT: Update the URLs in $OUTPUT_DIR/runtime-env.js after deploying the infrastructure"
else
    echo "🎉 Runtime configuration ready for production deployment!"
fi 