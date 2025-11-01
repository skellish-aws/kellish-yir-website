# Pre-Production TODO List

This document tracks items to complete before deploying to production.

## 🔒 Security Enhancements

### ✅ Completed

- [x] Move API keys from client-side to backend (SSM Parameter Store)
- [x] Implement Lambda proxies for USPS and Geoapify
- [x] Secure address validation via backend functions

### ⏳ Before Production

- [ ] **Migrate from SSM Parameter Store to AWS Secrets Manager**

  - **Why**: KMS encryption at rest, automatic rotation, versioning
  - **Cost**: ~$1.20/month (3 secrets × $0.40/secret)
  - **Implementation**:

    ```typescript
    // amplify/backend.ts
    import { Secret } from 'aws-cdk-lib/aws-secretsmanager'

    const geoapifySecret = Secret.fromSecretNameV2(
      backend.addressValidator.resources.lambda.stack,
      'GeoapifySecret',
      'kellish-yir/geoapify-api-key',
    )

    const uspsKeySecret = Secret.fromSecretNameV2(
      backend.addressValidator.resources.lambda.stack,
      'UspsKeySecret',
      'kellish-yir/usps/consumer-key',
    )

    const uspsSecretSecret = Secret.fromSecretNameV2(
      backend.addressValidator.resources.lambda.stack,
      'UspsSecretSecret',
      'kellish-yir/usps/consumer-secret',
    )

    // Grant read access
    geoapifySecret.grantRead(backend.addressValidator.resources.lambda)
    geoapifySecret.grantRead(backend.geoapifyProxy.resources.lambda)
    uspsKeySecret.grantRead(backend.addressValidator.resources.lambda)
    uspsKeySecret.grantRead(backend.uspsProxy.resources.lambda)
    uspsSecretSecret.grantRead(backend.addressValidator.resources.lambda)
    uspsSecretSecret.grantRead(backend.uspsProxy.resources.lambda)
    ```

  - **Lambda handler updates**:

    ```typescript
    // Replace SSMClient with SecretsManagerClient
    import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

    const secretsClient = new SecretsManagerClient({})

    async function getApiKey(): Promise<string> {
      const command = new GetSecretValueCommand({
        SecretId: 'kellish-yir/geoapify-api-key',
      })
      const response = await secretsClient.send(command)
      return response.SecretString || ''
    }
    ```

  - **Create secrets via CLI**:
    ```bash
    aws secretsmanager create-secret \
      --name kellish-yir/geoapify-api-key \
      --description "Geoapify API key" \
      --secret-string "YOUR_API_KEY"
    ```

- [ ] **Update client to use Geoapify proxy (remove direct API calls)**

  - Replace `geoapifyValidator` with `geoapifyProxyClient` in `RecipientAdmin.vue`
  - Replace `geoapifyAutocomplete` with proxy calls
  - Remove `VITE_GEOAPIFY_API_KEY` from `.env.local`
  - Test all validation flows

- [ ] **Implement API rate limiting**

  - Add rate limiting to Lambda proxies to prevent abuse
  - Consider AWS API Gateway in front of Lambda for built-in throttling

- [ ] **Set up WAF (Web Application Firewall)**
  - Protect Lambda Function URLs from DDoS attacks
  - Rate limiting at network level

## 📊 Monitoring & Alerts

- [ ] **CloudWatch Alarms**

  - Lambda errors (threshold: > 5 errors in 5 minutes)
  - Lambda duration (threshold: > 10 seconds)
  - SQS queue depth (threshold: > 100 messages)
  - DynamoDB throttling
  - API Gateway 4xx/5xx errors

- [ ] **CloudWatch Dashboards**

  - Create dashboard showing:
    - Address validation success rate
    - Lambda invocation counts
    - Error rates by function
    - SQS queue metrics
    - DynamoDB read/write capacity

- [ ] **Log Aggregation**

  - Set up CloudWatch Logs Insights queries
  - Create saved queries for common debugging scenarios
  - Set log retention policy (e.g., 30 days)

- [ ] **Cost Monitoring**
  - Set up AWS Budget alerts
  - Monitor Lambda invocations
  - Track API call costs (USPS, Geoapify)

## 🚀 Performance Optimization

- [ ] **Lambda Performance**

  - Increase memory for address-validator if needed
  - Consider provisioned concurrency for frequently-used functions
  - Optimize cold start times

- [ ] **DynamoDB Optimization**

  - Review and optimize table indexes
  - Consider on-demand vs provisioned capacity
  - Set up auto-scaling if using provisioned

- [ ] **Caching Strategy**
  - Consider caching validated addresses (ElastiCache/DynamoDB)
  - Cache Geoapify autocomplete results
  - Implement client-side caching for common addresses

## 🧪 Testing

- [ ] **End-to-End Testing**

  - Test US address validation
  - Test international address validation
  - Test CSV import with 100+ addresses
  - Test concurrent validation requests
  - Test error handling and recovery

- [ ] **Load Testing**

  - Test Lambda functions under load
  - Test SQS queue processing
  - Verify auto-scaling works

- [ ] **Integration Testing**
  - Test USPS API integration
  - Test Geoapify API integration
  - Test with invalid addresses
  - Test with missing fields

## 📝 Documentation

- [ ] **Update README.md**

  - Document Secrets Manager setup
  - Update deployment instructions
  - Add troubleshooting section

- [ ] **Create Runbook**

  - How to rotate API keys
  - How to handle Lambda errors
  - How to clear SQS dead-letter queue
  - How to restore from backup

- [ ] **Architecture Diagram**
  - Create visual diagram of complete system
  - Document data flows
  - Document security boundaries

## 🔄 DevOps

- [ ] **CI/CD Pipeline**

  - Set up GitHub Actions / AWS CodePipeline
  - Automated testing on PR
  - Automated deployment to staging
  - Manual approval for production

- [ ] **Separate Environments**

  - Dev environment (sandbox)
  - Staging environment (matches production)
  - Production environment
  - Different API keys per environment

- [ ] **Backup Strategy**

  - Enable DynamoDB point-in-time recovery
  - Regular backups of recipient data
  - Backup SSM/Secrets Manager values
  - Document restore procedure

- [ ] **Disaster Recovery Plan**
  - Document RTO (Recovery Time Objective)
  - Document RPO (Recovery Point Objective)
  - Test recovery procedures

## 🔐 Compliance & Privacy

- [ ] **Data Privacy**

  - Review data retention policies
  - Implement data deletion capabilities
  - GDPR compliance (if applicable)
  - Document what data is stored and why

- [ ] **Audit Trail**

  - Enable CloudTrail for all API calls
  - Log all address validations
  - Log all data modifications
  - Set up log integrity monitoring

- [ ] **Access Control**
  - Review IAM policies
  - Implement least-privilege access
  - Set up MFA for AWS Console access
  - Regular access review

## 💰 Cost Optimization

- [ ] **Review Pricing**

  - Lambda invocations: $0.20/million
  - Lambda compute: $0.0000166667/GB-sec
  - DynamoDB: On-demand vs provisioned
  - Secrets Manager: $0.40/secret/month
  - API calls: USPS (free), Geoapify (3000/day free)

- [ ] **Set Up Cost Alerts**

  - Alert if monthly cost exceeds $X
  - Alert on unusual spikes
  - Track cost per feature

- [ ] **Optimize Usage**
  - Cache frequently validated addresses
  - Batch SQS operations where possible
  - Use Lambda SnapStart if applicable

## 🎯 Feature Enhancements

- [ ] **Address Validation Improvements**

  - Implement confidence scoring
  - Allow manual override with reason
  - Track validation accuracy over time

- [ ] **Bulk Operations**

  - Add progress indicator for CSV imports
  - Support for pausing/resuming imports
  - Better error reporting for failed validations

- [ ] **User Experience**
  - Faster autocomplete (reduce debounce time)
  - Better loading states
  - Inline validation feedback

## 📋 Pre-Launch Checklist

One week before production launch:

- [ ] Run full regression test suite
- [ ] Load test with expected production volumes
- [ ] Review all CloudWatch alarms
- [ ] Verify backup/restore procedures
- [ ] Review security policies
- [ ] Update documentation
- [ ] Train support team
- [ ] Create rollback plan

Launch day:

- [ ] Deploy to production during low-traffic period
- [ ] Monitor CloudWatch dashboards
- [ ] Have team on standby for issues
- [ ] Verify all integrations working
- [ ] Send status update to stakeholders

## 📞 Support Contacts

- **AWS Support**: [Your support plan]
- **USPS API Support**: [Contact info]
- **Geoapify Support**: support@geoapify.com
- **Internal Team**: [Your team contacts]

## 📊 Success Metrics

Track these metrics post-launch:

- Address validation success rate (target: > 95%)
- Average validation time (target: < 2 seconds)
- Lambda error rate (target: < 0.1%)
- System uptime (target: 99.9%)
- User satisfaction scores

## 🔄 Regular Maintenance

Monthly:

- [ ] Review CloudWatch logs for errors
- [ ] Check API usage against quotas
- [ ] Review cost reports
- [ ] Update dependencies

Quarterly:

- [ ] Rotate API keys
- [ ] Review and update documentation
- [ ] Performance review and optimization
- [ ] Security audit

Annually:

- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Disaster recovery drill
- [ ] Compliance audit

---

## Priority Levels

🔴 **Critical** - Must complete before production
🟡 **Important** - Should complete before production
🟢 **Nice to have** - Can be done post-launch

**Current Status**: 🟡 Development phase - several critical items remaining

**Estimated Time to Production Ready**: 2-4 weeks (depending on priorities)
