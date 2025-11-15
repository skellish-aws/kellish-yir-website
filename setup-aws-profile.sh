#!/bin/bash
# Helper script to set AWS profile for this project
# Usage: source setup-aws-profile.sh

export AWS_PROFILE=softsys

echo "✅ AWS_PROFILE set to: $AWS_PROFILE"
echo "Run 'aws sts get-caller-identity' to verify it's working"

