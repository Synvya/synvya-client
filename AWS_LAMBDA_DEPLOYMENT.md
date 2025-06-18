# AWS Lambda Deployment Guide

This document describes the AWS Lambda infrastructure for the Synvya subscription system, replacing Netlify Functions with AWS Lambda.

## 🏗️ Architecture Overview

```
Internet → CloudFront → S3 (Static Files)          [Default behavior]
                     → Lambda Function URLs         [API calls]  
                ↓
         Security Headers Function
                ↓
              AWS Lambda Functions → S3 Database
                     ↓
           External APIs (Zaprite, Nostr relays)
```

## 📦 Lambda Functions

| Function | Purpose | Method | URL Pattern |
|----------|---------|--------|-------------|
| `check-subscription` | Validate user subscription status | POST | `/check-subscription` |
| `create-zaprite-order` | Create payment order in Zaprite | POST | `/create-zaprite-order` |
| `payment-webhook` | Process payment completion webhook | POST | `/payment-webhook` |
| `get-order` | Fetch order details from Zaprite | GET | `/get-order?orderId=...` |
| `get-user-orders` | Get user's order history | GET | `/get-user-orders?publicKey=...` |
| `check-contact` | Check if contact exists in Zaprite | POST | `/check-contact` |

## 🗂️ File Structure

```
aws-lambda/
├── lib/
│   └── subscription-db.js          # Shared S3 database module
├── check-subscription/
│   ├── index.js                    # Lambda handler
│   └── package.json                # Dependencies
├── create-zaprite-order/
│   ├── index.js
│   └── package.json
├── payment-webhook/
│   ├── index.js
│   └── package.json
├── get-order/
│   ├── index.js
│   └── package.json
├── get-user-orders/
│   ├── index.js
│   └── package.json
└── check-contact/
    ├── index.js
    └── package.json

scripts/
├── build-lambda-functions.sh       # Build all functions
└── deploy-lambda-infrastructure.sh # Deploy to AWS

aws-lambda-infrastructure.yml       # CloudFormation template
```

## 🚀 Deployment Methods

### Method 1: GitHub Actions (Recommended)

The Lambda functions are automatically deployed when you push changes to the `main` branch:

1. **Automatic Detection**: GitHub Actions detects changes to Lambda code
2. **Build & Package**: Functions are built and packaged into ZIP files
3. **Upload to S3**: Packages uploaded to S3 bucket
4. **CloudFormation Deploy**: Infrastructure updated via CloudFormation
5. **Output URLs**: New function URLs are displayed in logs

**Required GitHub Secrets:**
- `ZAPRITE_API_KEY`: Your Zaprite API key
- `AWS_DEPLOY_ROLE_ARN`: AWS IAM role ARN (already configured)

### Method 2: Manual Deployment

```bash
# Set required environment variable
export ZAPRITE_API_KEY="your_zaprite_api_key_here"

# Deploy everything
./scripts/deploy-lambda-infrastructure.sh
```

### Method 3: Individual Function Deployment

```bash
# Build functions only
./scripts/build-lambda-functions.sh

# Deploy specific function
aws lambda update-function-code \
  --function-name synvya-check-subscription \
  --zip-file fileb://build/lambda-functions/check-subscription.zip
```

## 🗄️ Database (S3)

**Bucket**: `synvya-subscriptions-prod`  
**File**: `subscriptions.json`  
**Encryption**: AES256  

### Data Structure
```json
{
  "contacts": {
    "publicKey1": {
      "contactId": "ct_...",
      "validThrough": "2024-12-31",
      "planType": "monthly",
      "orderId": "od_...",
      "status": "active",
      "orderIds": ["od_123", "od_456"]
    }
  }
}
```

## 🔧 Environment Variables

| Variable | Purpose | Set In |
|----------|---------|--------|
| `ZAPRITE_API_KEY` | Zaprite API authentication | CloudFormation parameter |
| `SUBSCRIPTION_DB_BUCKET` | S3 bucket for database | CloudFormation (auto) |
| `AWS_REGION` | AWS region | CloudFormation (auto) |

## 🔗 Integration with Frontend

### Before (Netlify Functions)
```javascript
const response = await fetch('/.netlify/functions/check-subscription', {
  method: 'POST',
  body: JSON.stringify({ publicKey })
});
```

### After (Lambda Function URLs)
```javascript
const response = await fetch('https://abc123.lambda-url.us-east-1.on.aws/', {
  method: 'POST',
  body: JSON.stringify({ publicKey })
});
```

## 🛡️ Security Features

- **CORS**: Configured for all function URLs
- **Encryption**: S3 data encrypted with AES256
- **IAM**: Least-privilege access for Lambda functions
- **VPC**: Functions run in AWS-managed VPC
- **Logging**: CloudWatch logs for all functions

## 📊 Monitoring

- **CloudWatch Logs**: `/aws/lambda/synvya-{function-name}`
- **CloudWatch Metrics**: Duration, errors, invocations
- **X-Ray Tracing**: Available for debugging (optional)

## 💰 Cost Optimization

- **Free Tier**: 1M requests/month + 400,000 GB-seconds compute
- **Runtime**: Node.js 20.x (fast cold starts)
- **Memory**: 128MB default (adjustable per function)
- **Timeout**: 30-60 seconds (payment function longer)

## 🔄 Migration from Netlify

1. **Deploy Lambda functions** (GitHub Actions or manual)
2. **Update frontend URLs** to use Lambda Function URLs
3. **Update Zaprite webhook** to point to new payment-webhook URL
4. **Test all functionality** to ensure compatibility
5. **Remove Netlify functions** once confirmed working

## 🚨 Troubleshooting

### Common Issues

**AccessDeniedException on S3**
- Check IAM role permissions
- Verify S3 bucket exists and is accessible

**Function URL returns 403 Forbidden**
- Check CORS configuration
- Verify function URL authentication is set to NONE

**Environment variables not set**
- Check CloudFormation parameters
- Verify deployment completed successfully

### Debugging

```bash
# Check function logs
aws logs tail /aws/lambda/synvya-check-subscription --follow

# Test function directly
aws lambda invoke \
  --function-name synvya-check-subscription \
  --payload '{"body":"{\"publicKey\":\"test\"}"}' \
  response.json
```

## 📞 Support

For issues or questions:
1. Check CloudWatch logs first
2. Verify all environment variables are set
3. Test with a minimal payload
4. Check GitHub Actions logs for deployment issues 