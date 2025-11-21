# Data Breach Response Procedure

**Last Updated**: 2025-01-XX  
**Purpose**: Procedure for detecting, assessing, and responding to data breaches in compliance with GDPR requirements

---

## Overview

This procedure outlines the steps to be taken in the event of a personal data breach affecting the Year-in-Review newsletter website. This procedure is designed to comply with GDPR Article 33-34 requirements for data breach notification.

---

## When to Notify

### Notification to Supervisory Authority (Article 33)

**Required when**: Breach is "likely to result in a risk to the rights and freedoms of individuals"

**Timeline**: Within 72 hours of becoming aware of the breach

**Not required when**: Breach is unlikely to result in a risk (e.g., encrypted data that cannot be accessed)

### Notification to Affected Individuals (Article 34)

**Required when**: Breach is "likely to result in a **high** risk to the rights and freedoms of individuals"

**Timeline**: Without undue delay (as soon as possible after breach is discovered)

**Not required when**:

- Data is encrypted and cannot be accessed
- Measures have been taken to mitigate the risk
- Notification would require disproportionate effort (in which case public notice may be used)

---

## Response Steps

### Step 1: Immediate Actions (Within 1 Hour)

**When a potential breach is discovered**:

1. **Document the Incident**:

   - What happened? (unauthorized access, data exposure, system compromise, etc.)
   - When did it occur? (date and time)
   - Who discovered it? (name, role, contact)
   - How was it discovered? (monitoring alert, user report, manual discovery)

2. **Take Immediate Action**:

   - **If ongoing**: Immediately revoke access, disable compromised accounts, isolate affected systems
   - **If data exposed**: Remove public access, secure endpoints, change API keys if compromised
   - **If system compromised**: Isolate affected systems, preserve logs for investigation

3. **Preserve Evidence**:
   - Save CloudWatch logs
   - Document system state
   - Take screenshots if applicable
   - Do NOT delete logs or evidence

---

### Step 2: Risk Assessment (Within 24 Hours)

**Assess the breach**:

1. **What Data Was Affected?**

   - Personal information (names, addresses, emails)
   - Account information (passwords - if compromised)
   - Newsletter content (PDFs, card images)
   - Access codes

2. **Was Data Actually Accessed?**

   - Was data viewed, copied, or modified?
   - By whom? (internal, external, unknown)
   - How many individuals affected?

3. **What's the Risk Level?**

   - **Low Risk**: Encrypted data, no actual access, minimal personal data
   - **Medium Risk**: Some personal data accessed, but limited scope
   - **High Risk**: Sensitive data accessed, many individuals affected, potential for identity theft or fraud

4. **What Measures Can Mitigate Risk?**
   - Password resets required
   - Access codes regenerated
   - Additional security measures implemented

---

### Step 3: Notification Decision (Within 48 Hours)

**Based on risk assessment, decide**:

1. **Low Risk Scenario** (No notification required):

   - Document the incident
   - Take corrective action
   - Review and improve security measures
   - No notification to authority or users needed

2. **Medium Risk Scenario** (Notify authority only):

   - Notify supervisory authority within 72 hours
   - Document the incident
   - Monitor for any user impact
   - Consider notifying users if risk increases

3. **High Risk Scenario** (Notify both authority and users):
   - Notify supervisory authority within 72 hours
   - Notify affected users without undue delay
   - Provide clear information and guidance
   - Offer support and resources

---

### Step 4: Notification (If Required)

#### Notification to Supervisory Authority

**Contact Information**:

- **For EU users**: Contact the Data Protection Authority (DPA) in the country where the breach occurred or where users are located
  - **Germany**: Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)
    - Website: https://www.bfdi.bund.de
    - Email: poststelle@bfdi.bund.de
  - **Portugal**: Comissão Nacional de Proteção de Dados (CNPD)
    - Website: https://www.cnpd.pt
    - Email: geral@cnpd.pt
- **For US users**: No federal requirement, but consider state requirements (e.g., California)

**Information to Provide**:

- Nature of the breach (what happened)
- Categories and approximate number of individuals affected
- Categories and approximate number of personal data records concerned
- Likely consequences of the breach
- Measures taken or proposed to address the breach
- Contact point for more information

**Notification Template** (to be filled out):

```
Subject: Personal Data Breach Notification - [Date]

To: [Supervisory Authority Name]

Dear [Authority],

We are notifying you of a personal data breach that occurred on [Date/Time].

Nature of Breach:
[Describe what happened]

Categories of Data Affected:
[Names, addresses, emails, etc.]

Number of Individuals Affected:
[Approximate number]

Likely Consequences:
[Potential impact on individuals]

Measures Taken:
[Actions taken to address the breach]

Contact Information:
[Your name, email, phone]

Sincerely,
[Your name]
```

#### Notification to Affected Users

**When Required**: High risk to rights and freedoms

**Information to Provide**:

- Clear description of what happened
- What data was affected
- Likely consequences
- Measures taken to address the breach
- Recommendations for users (e.g., change password, monitor accounts)
- Contact information for questions

**Email Template**:

```
Subject: Important: Security Notice Regarding Your Account

Dear [User Name],

We are writing to inform you of a security incident that may have affected your account.

What Happened:
[Clear description of the breach]

What Information Was Affected:
[Specific data categories]

What We're Doing:
[Measures taken to address the breach]

What You Should Do:
[Recommendations for users]

If you have questions or concerns, please contact us at [email].

We sincerely apologize for any inconvenience this may cause.

Sincerely,
[Your name]
[Your title]
```

---

### Step 5: Documentation and Follow-Up

**Document Everything**:

1. **Incident Log**:

   - Date/time of discovery
   - Date/time of breach (if known)
   - Who discovered it
   - What happened
   - Who was affected
   - Actions taken
   - Notifications sent
   - Follow-up actions

2. **Keep Records**:

   - Store incident documentation securely
   - Retain for at least 2 years (GDPR requirement)
   - Review periodically for patterns

3. **Post-Incident Review**:
   - What went well?
   - What could be improved?
   - Update security measures
   - Update this procedure if needed

---

## Breach Scenarios

### Scenario 1: Accidental Internal Access

**Example**: Admin accidentally views wrong user's data

**Risk Level**: Low

**Response**:

- Document the incident
- Verify no data was copied or shared
- Review access controls
- No notification required (low risk)

---

### Scenario 2: Unauthorized External Access

**Example**: Unauthorized person gains access to database

**Risk Level**: High

**Response**:

- Immediately revoke access
- Assess what data was accessed
- Notify supervisory authority within 72 hours
- Notify affected users without undue delay
- Require password resets
- Regenerate access codes if needed

---

### Scenario 3: Data Exposed Publicly

**Example**: S3 bucket misconfigured, data publicly accessible

**Risk Level**: High

**Response**:

- Immediately secure the bucket
- Assess exposure duration
- Check access logs to see if data was accessed
- Notify supervisory authority within 72 hours
- Notify affected users without undue delay

---

### Scenario 4: System Compromise

**Example**: Ransomware or malware affecting system

**Risk Level**: High

**Response**:

- Isolate affected systems
- Assess data access/encryption
- Notify supervisory authority within 72 hours
- Notify affected users if data was accessed
- Implement additional security measures

---

## Prevention Measures

**Current Security Measures**:

- ✅ Encryption at rest (DynamoDB, S3, Cognito)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Access controls (authentication, authorization)
- ✅ Audit logging (CloudWatch, CloudTrail)
- ✅ Regular security reviews

**Ongoing Improvements**:

- Monitor CloudWatch logs for suspicious activity
- Review access logs regularly
- Keep security measures up to date
- Train users on security best practices

---

## Contact Information

**Internal Contacts**:

- **Primary Contact**: [Your name and email]
- **Backup Contact**: [Backup contact information]

**External Contacts**:

- **German DPA**: poststelle@bfdi.bund.de
- **Portuguese DPA**: geral@cnpd.pt
- **AWS Support**: [If needed for technical assistance]

---

## Review Schedule

This procedure should be reviewed:

- **Annually**: Review and update procedure
- **After any breach**: Update based on lessons learned
- **When regulations change**: Update to reflect new requirements

**Last Review Date**: 2025-01-XX  
**Next Review Date**: 2026-01-XX

---

_This document is a living document and should be updated as needed._
