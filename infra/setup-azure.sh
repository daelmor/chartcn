#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# chartcn — One-time Azure infrastructure setup
#
# Prerequisites:
#   - Azure CLI installed and logged in (`az login`)
#   - A GitHub repo ready for CI/CD
#
# This script:
#   1. Creates a resource group
#   2. Deploys all infrastructure via Bicep (ACR, Container Apps, etc.)
#   3. Creates a service principal for GitHub Actions
#   4. Prints the values you need to set as GitHub secrets
#
# Usage:
#   chmod +x infra/setup-azure.sh
#   ./infra/setup-azure.sh
# ──────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration (edit these) ────────────────────────────────

RESOURCE_GROUP="chartcn-rg"
LOCATION="eastus"
APP_NAME="chartcn"
SUBSCRIPTION_ID=""  # leave empty to use current default subscription

# ──────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════╗"
echo "║         chartcn — Azure Setup                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Resolve subscription
if [ -z "$SUBSCRIPTION_ID" ]; then
  SUBSCRIPTION_ID=$(az account show --query id -o tsv)
fi
echo "→ Subscription: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

# 1. Create Resource Group
echo ""
echo "1/4 Creating resource group: $RESOURCE_GROUP in $LOCATION ..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

# 2. Deploy Bicep template
echo "2/4 Deploying infrastructure (ACR, Container Apps, Log Analytics) ..."
DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam \
  --parameters imageTag=latest \
  --query 'properties.outputs' \
  --output json)

ACR_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.acrName.value')
ACR_LOGIN_SERVER=$(echo "$DEPLOY_OUTPUT" | jq -r '.acrLoginServer.value')
CONTAINER_APP_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.containerAppName.value')
CONTAINER_ENV_NAME=$(echo "$DEPLOY_OUTPUT" | jq -r '.containerAppsEnvName.value')
APP_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '.containerAppUrl.value')

echo "   ACR:            $ACR_LOGIN_SERVER"
echo "   Container App:  $CONTAINER_APP_NAME"
echo "   URL:            $APP_URL"

# 3. Create Service Principal for GitHub Actions
echo ""
echo "3/4 Creating service principal for GitHub Actions CI/CD ..."
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "${APP_NAME}-github-ci" \
  --role contributor \
  --scopes "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" \
  --sdk-auth)

# 4. Get ACR credentials
echo "4/4 Retrieving ACR credentials ..."
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)

# ── Print GitHub Secrets ──────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Setup complete! Set these GitHub Secrets:       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Go to: https://github.com/<your-org>/chartcn/settings/secrets/actions"
echo ""
echo "┌─────────────────────────┬────────────────────────────────────────┐"
echo "│ Secret Name             │ Value                                  │"
echo "├─────────────────────────┼────────────────────────────────────────┤"

printf "│ %-23s │ (see JSON blob below)                  │\n" "AZURE_CREDENTIALS"
printf "│ %-23s │ %-38s │\n" "AZURE_SUBSCRIPTION_ID" "$SUBSCRIPTION_ID"
printf "│ %-23s │ %-38s │\n" "AZURE_RESOURCE_GROUP" "$RESOURCE_GROUP"
printf "│ %-23s │ %-38s │\n" "ACR_LOGIN_SERVER" "$ACR_LOGIN_SERVER"
printf "│ %-23s │ %-38s │\n" "ACR_USERNAME" "$ACR_USERNAME"
printf "│ %-23s │ %-38s │\n" "ACR_PASSWORD" "(see below)"
printf "│ %-23s │ %-38s │\n" "CONTAINER_APP_NAME" "$CONTAINER_APP_NAME"
printf "│ %-23s │ %-38s │\n" "CONTAINER_ENV_NAME" "$CONTAINER_ENV_NAME"

echo "└─────────────────────────┴────────────────────────────────────────┘"
echo ""
echo "── AZURE_CREDENTIALS (paste the entire JSON): ──"
echo "$SP_OUTPUT"
echo ""
echo "── ACR_PASSWORD: ──"
echo "$ACR_PASSWORD"
echo ""
echo "── Your app will be available at: ──"
echo "$APP_URL"
echo ""
echo "Done! Now push to main to trigger the CI/CD pipeline."
