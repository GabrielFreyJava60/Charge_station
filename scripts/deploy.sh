#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-dev}"

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: ./scripts/deploy.sh [dev|prod]"
  exit 1
fi

echo "=== Deploying EV Charging Station System ($ENV) ==="

echo ""
echo "--- Building SAM application ---"
cd infrastructure
sam build --parameter-overrides "Environment=$ENV"

echo ""
echo "--- Deploying to AWS ($ENV) ---"
if [[ "$ENV" == "prod" ]]; then
  sam deploy --config-env prod
else
  sam deploy
fi

echo ""
echo "--- Building and pushing backend Docker image ---"
cd ../backend

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
REPO_NAME="ev-charging-backend-$ENV"
IMAGE_TAG="$REPO_NAME:latest"

aws ecr describe-repositories --repository-names "$REPO_NAME" 2>/dev/null || \
  aws ecr create-repository --repository-name "$REPO_NAME"

aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker build -t "$IMAGE_TAG" .
docker tag "$IMAGE_TAG" "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$IMAGE_TAG"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$IMAGE_TAG"

echo ""
echo "--- Building frontend ---"
cd ../frontend
npm ci
npm run build

echo ""
echo "=== Deployment complete ($ENV) ==="
