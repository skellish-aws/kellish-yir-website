# Safe Workflow

1. Start the sandbox (if not already running):
   `npx ampx dev`
1. Make any model or schema changes (optional).
1. Generate GraphQL client code:
   `npx ampx generate graphql-client-code`
1. Continue local development with npm run dev.

# Seed Admin group and initial adminb user

1. Find the user pool
   `aws cognito-idp list-user-pools --max-results 60
{
    "UserPools": [
        {
            "Id": "us-east-1_PvmvYtxJq",
            "Name": "amplifyAuthUserPool4BA7F805-oCV9mGHWHwgK",
            "LambdaConfig": {},
            "LastModifiedDate": "2025-06-08T13:22:30.981000-04:00",
            "CreationDate": "2025-06-08T13:22:30.981000-04:00"
        }
    ]
}`
2. Create the 'Admin' group (if missing)
   `aws cognito-idp create-group \
  --group-name Admin \
  --user-pool-id <your_user_pool_id> \
  --description "Administrators of the Year-in-Review app"`
   If the group already exists, this will return an error you can ignore.

3. Create the initial admin user

Replace <your_email@example.com> with your own email:

`aws cognito-idp admin-create-user \
  --user-pool-id <your_user_pool_id> \
  --username <your_email@example.com> \
  --user-attributes Name=email,Value=<your_email@example.com> Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --temporary-password "TempP@ssword123!"`
🔐 This creates a user with a temporary password and suppresses the welcome email (you can skip the --message-action if you want AWS to email you the invite).

4. Add the user to the Admin group
   `aws cognito-idp admin-add-user-to-group \
  --user-pool-id <your_user_pool_id> \
  --username <your_email@example.com> \
  --group-name Admin`

Optional: Set password as permanent

If you want to set the password programmatically so no reset is required:
`aws cognito-idp admin-set-user-password \
  --user-pool-id <your_user_pool_id> \
  --username <your_email@example.com> \
  --password "<your_desired_strong_password>" \
  --permanent`
