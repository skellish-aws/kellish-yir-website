# AWS Profile Configuration

This project is configured to use the **'softsys'** AWS profile instead of the default profile.

## Quick Start

### Option 1: Use npm scripts (Recommended)
```bash
# Deploy Amplify sandbox with softsys profile
npm run amplify:sandbox

# One-time deployment
npm run amplify:deploy
```

### Option 2: Set environment variable in your terminal session
```bash
# In your terminal (zsh/bash)
export AWS_PROFILE=softsys

# Then run commands normally
npx ampx sandbox
aws ssm get-parameter --name "/kellish-yir/addresszen/api-key"
```

### Option 3: Source the helper script
```bash
# One-time setup per terminal session
source setup-aws-profile.sh

# Then run commands normally
npx ampx sandbox
```

### Option 4: Use inline for single commands
```bash
# Run a single command with the profile
AWS_PROFILE=softsys npx ampx sandbox
AWS_PROFILE=softsys aws ssm get-parameter --name "/kellish-yir/addresszen/api-key"
```

## Verify Profile is Active

Check which AWS account you're using:
```bash
aws sts get-caller-identity --profile softsys
```

Or if you've exported AWS_PROFILE:
```bash
export AWS_PROFILE=softsys
aws sts get-caller-identity
```

## Profile Configuration

The 'softsys' profile should be configured in `~/.aws/credentials`:

```ini
[softsys]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

And optionally in `~/.aws/config`:

```ini
[profile softsys]
region = us-east-1
output = json
```

## Commands That Need the Profile

These commands need the AWS profile:

1. **Amplify deployment**
   ```bash
   npm run amplify:sandbox
   # or
   AWS_PROFILE=softsys npx ampx sandbox
   ```

2. **AWS CLI commands** (SSM, Lambda, etc.)
   ```bash
   AWS_PROFILE=softsys aws ssm get-parameter --name "/kellish-yir/addresszen/api-key"
   AWS_PROFILE=softsys aws logs tail /aws/lambda/addresszen-proxy-* --follow
   ```

3. **Helper scripts** (update them to include `--profile softsys`)
   - `helper-scripts/seed-admin.sh`

## Troubleshooting

### Profile not found
```bash
# Verify profile exists
cat ~/.aws/credentials | grep -A 2 "\[softsys\]"

# List all profiles
aws configure list-profiles
```

### Wrong account being used
```bash
# Check current identity
aws sts get-caller-identity

# Force use softsys profile
AWS_PROFILE=softsys aws sts get-caller-identity
```

### Profile works in terminal but not in scripts
Make sure scripts export the variable:
```bash
export AWS_PROFILE=softsys
```

## Permanent Setup (Optional)

To make this the default for this project directory, you can:

1. **Add to `.zshrc` or `.bashrc`** (only for this machine):
   ```bash
   # Add at end of ~/.zshrc or ~/.bashrc
   export AWS_PROFILE=softsys
   ```

2. **Create a `.envrc` file** (if using direnv):
   ```bash
   export AWS_PROFILE=softsys
   ```

3. **Add to shell profile with directory check**:
   ```bash
   # In ~/.zshrc
   if [[ "$PWD" == *"kellish-yir-website"* ]]; then
     export AWS_PROFILE=softsys
   fi
   ```

## Switching Back to Default

When you're done debugging and want to switch back:
```bash
unset AWS_PROFILE
# or
export AWS_PROFILE=default
```

