# Secure AWS Deployment Guide for Synvya Frontend

## Overview

This guide will help you deploy your Nostr-based frontend application to AWS as a secure, static site. Since your frontend handles all Nostr interactions directly, we can deploy it without exposing any backend APIs, significantly reducing your attack surface.

## Architecture Benefits

✅ **Zero Backend Exposure**: No server-side vulnerabilities  
✅ **Global CDN**: Fast loading worldwide via CloudFront  
✅ **HTTPS by Default**: SSL/TLS encryption for all traffic  
✅ **Security Headers**: Protection against common web attacks  
✅ **Cost Effective**: Pay only for storage and bandwidth  
✅ **Auto-Scaling**: Handles traffic spikes automatically  

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **Node.js** and npm installed

3. **SSL Certificate** for client.synvya.com already set up in AWS Certificate Manager (us-east-1 region)

4. **DNS Access** to synvya.com domain (Route 53 or external DNS provider)

## Deployment Options

### Option 1: Quick Deployment with Custom Domain (Recommended)

The deployment script is configured to use your existing SSL certificate for client.synvya.com:

```bash
chmod +x deploy-aws-static.sh
./deploy-aws-static.sh
```

After deployment, update your DNS:

```bash
chmod +x update-dns.sh
./update-dns.sh <cloudfront-domain-from-deployment-output>
```

### Option 2: Manual Step-by-Step

#### Step 1: Build Your Application
```bash
npm run build
```

#### Step 2: Create S3 Bucket
```bash
BUCKET_NAME="synvya-frontend-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1
```

#### Step 3: Configure Bucket Security
```bash
# Block public access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

#### Step 4: Upload Files
```bash
aws s3 sync dist/ s3://$BUCKET_NAME --delete
```

#### Step 5: Create CloudFront Distribution
```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## Security Enhancements

### 1. Content Security Policy (CSP)
The deployment includes a strict CSP that allows:
- **Nostr WebSocket connections** (wss://)
- **HTTPS API calls** to trusted domains
- **Local resources** only
- **Blocks** inline scripts and eval()

### 2. Security Headers
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information

### 3. Network Security
- **WAF Integration**: Optional Web Application Firewall
- **DDoS Protection**: Built-in via CloudFront
- **IP Whitelisting**: Can be configured if needed

## Custom Domain Setup

Your deployment is already configured for client.synvya.com with your existing SSL certificate!

### Automatic Setup
The deployment script will:
1. ✅ Find your existing SSL certificate for client.synvya.com
2. ✅ Configure CloudFront with custom domain and SSL
3. ✅ Set up security headers and caching

### DNS Configuration (Final Step)
After deployment, you just need to point your domain to CloudFront:

**Option A: Using Route 53 (Recommended)**
```bash
./update-dns.sh <cloudfront-domain>
```

**Option B: Manual DNS Setup**
Create a CNAME record in your DNS provider:
- **Name**: client
- **Value**: [CloudFront domain from deployment output]
- **TTL**: 300

## Environment Variables

Since this is a static deployment, all environment variables must be set at build time:

```bash
# .env.production
VITE_NOSTR_RELAYS=wss://relay.primal.net,wss://relay.damus.io
VITE_BLOSSOM_SERVER=https://blossom.band
VITE_APP_NAME=Synvya
```

## Monitoring and Logging

### CloudWatch Integration
```bash
# Enable CloudFront logging
aws cloudfront update-distribution \
    --id YOUR_DISTRIBUTION_ID \
    --distribution-config file://logging-config.json
```

### Cost Monitoring
```bash
# Set up billing alerts
aws budgets create-budget --account-id YOUR_ACCOUNT_ID --budget file://budget-config.json
```

## Backup and Disaster Recovery

### 1. Version Control
- All code in Git repository
- Tagged releases for rollbacks

### 2. S3 Versioning
```bash
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled
```

### 3. Cross-Region Replication
```bash
# Optional: Replicate to another region
aws s3api put-bucket-replication \
    --bucket $BUCKET_NAME \
    --replication-configuration file://replication-config.json
```

## Continuous Deployment

### GitHub Actions Workflow
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to S3
        run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

## Security Checklist

- [ ] S3 bucket is not publicly accessible
- [ ] CloudFront enforces HTTPS
- [ ] Security headers are applied
- [ ] CSP is configured for Nostr connections
- [ ] SSL certificate is valid
- [ ] Access logs are enabled
- [ ] Cost monitoring is configured
- [ ] Backup strategy is in place

## Troubleshooting

### Common Issues

1. **CORS Errors with Nostr Relays**
   - Ensure CSP allows WebSocket connections
   - Check connect-src directive includes wss:

2. **Assets Not Loading**
   - Verify S3 bucket policy allows CloudFront access
   - Check file permissions and paths

3. **Routing Issues (404 on Refresh)**
   - Ensure CloudFront error pages redirect to index.html
   - Check distribution configuration

### Debugging Commands

```bash
# Test CloudFront distribution
curl -I https://your-distribution-domain.cloudfront.net

# Check S3 bucket contents
aws s3 ls s3://your-bucket-name --recursive

# View CloudFront logs
aws logs describe-log-groups --log-group-name-prefix /aws/cloudfront
```

## Cost Optimization

### Estimated Monthly Costs (USD)
- **S3 Storage**: ~$0.50 (for typical SPA)
- **CloudFront**: ~$1-5 (depends on traffic)
- **Route 53**: ~$0.50 (if using custom domain)
- **SSL Certificate**: Free (via ACM)

### Optimization Tips
1. Use CloudFront caching effectively
2. Compress assets during build
3. Implement cache-busting for updates
4. Monitor usage with CloudWatch

## Next Steps

1. **Deploy**: Run the deployment script
2. **Test**: Verify all functionality works
3. **Monitor**: Set up CloudWatch alerts
4. **Optimize**: Configure caching and compression
5. **Scale**: Add WAF and advanced security features

Your Nostr-based frontend will now be deployed securely on AWS with minimal attack surface! 