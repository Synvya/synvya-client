#!/bin/bash

# Generate runtime-env.js with Lambda function URLs
set -e

# Configuration
STACK_NAME="synvya-lambda-infrastructure"
OUTPUT_DIR="${1:-public}"

echo "🔧 Generating runtime-env.js configuration..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate runtime-env.js with hardcoded working Lambda URLs
# Note: Using hardcoded URLs because CloudFormation outputs may be outdated 
# from manual function URL recreations during troubleshooting
cat > "$OUTPUT_DIR/runtime-env.js" << 'EOF'
window.runtimeEnv = {
  checkSubscriptionUrl: 'https://si4pgos4rx3nykzya2y5ugcp6a0vwgdj.lambda-url.us-east-1.on.aws/',
  createZapriteOrderUrl: 'https://r7sts256fb7qrwouximz3x2q6y0yroyx.lambda-url.us-east-1.on.aws/',
  paymentWebhookUrl: 'https://trfdrrplkdsjo3kynxuprpfnre0pxklc.lambda-url.us-east-1.on.aws/',
  getOrderUrl: 'https://ynbxffgyxiqun476l2oa27qyma0neved.lambda-url.us-east-1.on.aws/',
  getUserOrdersUrl: 'https://msuv6n37lgdw3tlu2ptm5xpsea0rqqoe.lambda-url.us-east-1.on.aws/',
  checkContactUrl: 'https://tkrxeipv25uhrl7vea7h2rijgy0duzvo.lambda-url.us-east-1.on.aws/'
};
EOF

echo "✅ Runtime configuration generated: $OUTPUT_DIR/runtime-env.js"
echo "📋 Lambda URLs configured:"
echo "   - checkSubscription: si4pgos4rx3nykzya2y5ugcp6a0vwgdj"
echo "   - createZapriteOrder: r7sts256fb7qrwouximz3x2q6y0yroyx" 
echo "   - paymentWebhook: trfdrrplkdsjo3kynxuprpfnre0pxklc"
echo "   - getOrder: ynbxffgyxiqun476l2oa27qyma0neved"
echo "   - getUserOrders: msuv6n37lgdw3tlu2ptm5xpsea0rqqoe"
echo "   - checkContact: tkrxeipv25uhrl7vea7h2rijgy0duzvo" 