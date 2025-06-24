#!/bin/bash

# This script builds and pushes all service images to AWS ECR.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Replace with your AWS Account ID and preferred region.
AWS_ACCOUNT_ID="279663581923"
AWS_REGION="us-west-1"

# A list of all services to be built.
# Note: The 'frontend' service is handled separately below.
SERVICES=(
  "user-service"
  "catalog-service"
  "cart-service"
  "checkout-service"
  "notification-service"
  "payment-service"
)

# --- Execution ---

# 1. Authenticate Docker with ECR
echo "Authenticating Docker with AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo "Authentication successful."

# 2. Build and push all Go backend services
for service in "${SERVICES[@]}"
do
  echo "--------------------------------------------------"
  echo "Processing service: ${service}"
  echo "--------------------------------------------------"

  REPO_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${service}"

  # Create ECR repository if it doesn't exist.
  # The '|| true' part ensures the script doesn't exit if the repo already exists.
  aws ecr create-repository --repository-name "${service}" --region "${AWS_REGION}" --image-scanning-configuration scanOnPush=true || true

  # Build and push the image
  cd "services/${service}"
  docker build -t "${REPO_URI}:latest" -f Dockerfile.prod .
  docker push "${REPO_URI}:latest"
  cd ../..
done

# 3. Build and push the frontend service separately
echo "--------------------------------------------------"
echo "Processing service: frontend"
echo "--------------------------------------------------"
FRONTEND_SERVICE_NAME="frontend"
FRONTEND_REPO_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_SERVICE_NAME}"
aws ecr create-repository --repository-name "${FRONTEND_SERVICE_NAME}" --region "${AWS_REGION}" --image-scanning-configuration scanOnPush=true || true
cd frontend
docker build -t "${FRONTEND_REPO_URI}:latest" -f Dockerfile.prod .
docker push "${FRONTEND_REPO_URI}:latest"
cd ..

echo "--------------------------------------------------"
echo "All images pushed successfully to ECR."
echo "--------------------------------------------------"