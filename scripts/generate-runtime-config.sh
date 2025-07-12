#!/bin/bash

# Generate runtime-env.js with Lambda function URLs
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
OUTPUT_DIR="${1:-public}"

echo "🔧 Generating runtime-env.js configuration..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate runtime-env.js with Lambda function URLs
# Note: Update these URLs after deploying the new infrastructure
cat > "$OUTPUT_DIR/runtime-env.js" << 'EOF'
window.runtimeEnv = {
  healthUrl: 'TBD-AFTER-DEPLOYMENT',
  recordTermsAcceptanceUrl: 'TBD-AFTER-DEPLOYMENT'
};
EOF

echo "✅ Runtime configuration generated: $OUTPUT_DIR/runtime-env.js"
echo "📋 Lambda URLs configured:"
echo "   - healthUrl: TBD-AFTER-DEPLOYMENT"
echo "   - recordTermsAcceptanceUrl: TBD-AFTER-DEPLOYMENT"
echo ""
echo "⚠️  IMPORTANT: Update the URLs in $OUTPUT_DIR/runtime-env.js after deploying the infrastructure" 