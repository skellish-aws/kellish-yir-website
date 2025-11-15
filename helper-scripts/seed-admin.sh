#!/bin/bash

# CONFIGURE THESE
AMPLIFY_APP_NAME="kellishyirwebsite"
REGION="us-east-1"
ADMIN_EMAIL="skellish@comcast.net"
ADMIN_PASSWORD="Password123!"

# Use softsys profile if AWS_PROFILE not set
AWS_PROFILE="${AWS_PROFILE:-softsys}"

# Locate the Cognito user pool by name
USER_POOL_ID=$(aws cognito-idp list-user-pools \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --max-results 60 \
  --query "UserPools[?Name=='$AMPLIFY_APP_NAME'].Id" \
  --output text)

if [[ -z "$USER_POOL_ID" ]]; then
  echo "❌ Could not find user pool for app '$AMPLIFY_APP_NAME'"
  exit 1
fi

echo "✅ Found user pool: $USER_POOL_ID"

# Create the Admin group if not exists
echo "➡️ Creating Admin group (if missing)..."
aws cognito-idp create-group \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --group-name Admin \
  --description "Administrators of the Year-in-Review app" \
  2>/dev/null || echo "ℹ️ Group may already exist."

# Create the user
echo "➡️ Creating user '$ADMIN_EMAIL'..."
aws cognito-idp admin-create-user \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --temporary-password "$ADMIN_PASSWORD" \
  2>/dev/null || echo "ℹ️ User may already exist."

# Add user to Admin group
echo "➡️ Adding user to Admin group..."
aws cognito-idp admin-add-user-to-group \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --group-name Admin

# Make the password permanent
echo "➡️ Setting permanent password..."
aws cognito-idp admin-set-user-password \
  --profile "$AWS_PROFILE" \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --permanent

echo "✅ Done! You can now log in as $ADMIN_EMAIL with the specified password."
