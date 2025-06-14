#!/bin/bash

# DNS Update Script for Synvya Frontend
# This script helps set up DNS for client.synvya.com -> CloudFront

set -e

CUSTOM_DOMAIN="client.synvya.com"
HOSTED_ZONE_DOMAIN="synvya.com"

echo "🌐 Setting up DNS for $CUSTOM_DOMAIN..."

# Get the CloudFront distribution domain (you'll need to provide this)
if [ -z "$1" ]; then
    echo "Usage: ./update-dns.sh <cloudfront-domain>"
    echo "Example: ./update-dns.sh d1234567890abc.cloudfront.net"
    exit 1
fi

CLOUDFRONT_DOMAIN="$1"

# Find the hosted zone for synvya.com
echo "🔍 Finding Route 53 hosted zone for $HOSTED_ZONE_DOMAIN..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='$HOSTED_ZONE_DOMAIN.'].Id" --output text | sed 's/\/hostedzone\///')

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone not found for $HOSTED_ZONE_DOMAIN"
    echo "🔧 Manual DNS setup required:"
    echo "   Create a CNAME record in your DNS provider:"
    echo "   Name: client"
    echo "   Value: $CLOUDFRONT_DOMAIN"
    echo "   TTL: 300"
    exit 1
fi

echo "✅ Found hosted zone: $HOSTED_ZONE_ID"

# Create the DNS change batch
cat > dns-change.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$CUSTOM_DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$CLOUDFRONT_DOMAIN",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }
    ]
}
EOF

# Apply the DNS change
echo "🔄 Updating DNS record..."
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file://dns-change.json \
    --query 'ChangeInfo.Id' \
    --output text)

echo "✅ DNS update initiated!"
echo "📋 Change Details:"
echo "   Change ID: $CHANGE_ID"
echo "   Domain: $CUSTOM_DOMAIN"
echo "   Target: $CLOUDFRONT_DOMAIN"
echo ""
echo "⏱️  DNS propagation may take a few minutes"
echo "🧪 Test with: dig $CUSTOM_DOMAIN"

# Cleanup
rm -f dns-change.json

echo "🎉 DNS setup complete!" 