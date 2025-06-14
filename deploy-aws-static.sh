#!/bin/bash

# AWS S3 + CloudFront Deployment Script for Synvya Frontend
# This script deploys your React frontend as a secure static site

set -e

# Configuration
CUSTOM_DOMAIN="client.synvya.com"
BUCKET_NAME="synvya-frontend-client-$(date +%s)"  # Make it unique
CLOUDFRONT_COMMENT="Synvya Frontend Distribution for $CUSTOM_DOMAIN"
REGION="us-east-1"  # ACM certificates for CloudFront must be in us-east-1

echo "🚀 Starting AWS deployment for Synvya Frontend..."

# Step 0: Get the existing SSL certificate ARN
echo "🔍 Finding SSL certificate for $CUSTOM_DOMAIN..."
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='$CUSTOM_DOMAIN'].CertificateArn" --output text)

if [ -z "$CERT_ARN" ]; then
    echo "❌ SSL certificate not found for $CUSTOM_DOMAIN"
    echo "Please ensure you have a valid SSL certificate in AWS Certificate Manager (us-east-1 region)"
    exit 1
fi

echo "✅ Found SSL certificate: $CERT_ARN"

# Step 1: Build the production version
echo "📦 Building production build..."
npm run build

# Step 2: Create S3 bucket
echo "🪣 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Step 3: Configure bucket for static website hosting
echo "🌐 Configuring S3 for static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Step 4: Block public access (we'll use CloudFront)
echo "🔒 Configuring bucket security..."
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false

# Step 5: Create bucket policy for CloudFront access
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Step 6: Upload build files
echo "📤 Uploading files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --cache-control max-age=31536000,public

# Set special cache headers for HTML files
aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html \
    --metadata-directive REPLACE \
    --cache-control max-age=0,no-cache,no-store,must-revalidate \
    --content-type text/html

# Step 7: Create CloudFront distribution
echo "☁️ Creating CloudFront distribution with custom domain..."
cat > cloudfront-config.json << EOF
{
    "CallerReference": "synvya-$(date +%s)",
    "Comment": "$CLOUDFRONT_COMMENT",
    "Aliases": {
        "Quantity": 1,
        "Items": ["$CUSTOM_DOMAIN"]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200"
            }
        ]
    },
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "PriceClass": "PriceClass_100"
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text)
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

echo "✅ Deployment complete!"
echo "📋 Deployment Details:"
echo "   S3 Bucket: $BUCKET_NAME"
echo "   CloudFront ID: $DISTRIBUTION_ID"
echo "   CloudFront Domain: https://$CLOUDFRONT_DOMAIN"
echo "   Custom Domain: https://$CUSTOM_DOMAIN"
echo "   SSL Certificate: $CERT_ARN"
echo ""
echo "⚠️  Important: CloudFront distribution may take 15-20 minutes to deploy globally"
echo "🔧 Final step: Update your DNS to point $CUSTOM_DOMAIN to $CLOUDFRONT_DOMAIN"
echo "   Create a CNAME record: $CUSTOM_DOMAIN -> $CLOUDFRONT_DOMAIN"
echo "   Or use Route 53 alias if you're using Route 53 for DNS"

# Cleanup temporary files
rm -f bucket-policy.json cloudfront-config.json

echo "🎉 Your frontend is now deployed securely on AWS!" 