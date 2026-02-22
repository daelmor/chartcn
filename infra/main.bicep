// ──────────────────────────────────────────────────────────────
// chartcn — Azure Infrastructure (Bicep)
//
// Deploys:
//   1. Azure Container Registry (ACR)
//   2. Log Analytics Workspace
//   3. Container Apps Environment
//   4. Container App (chartcn) with system-assigned managed identity
//   5. Storage Account with blob containers (configs, images)
//   6. RBAC: Storage Blob Data Contributor for the Container App
// ──────────────────────────────────────────────────────────────

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Base name used for all resources')
param appName string = 'chartcn'

@description('Container image tag to deploy')
param imageTag string = 'latest'

@description('CPU cores for the container (e.g. 1.0)')
param cpuCores string = '1.0'

@description('Memory in Gi for the container (e.g. 2.0)')
param memoryGi string = '2.0'

@description('Minimum number of replicas')
param minReplicas int = 0

@description('Maximum number of replicas')
param maxReplicas int = 3

@description('Max concurrent renders (Puppeteer page pool)')
param maxConcurrentRenders int = 5

@description('LRU cache max entries')
param cacheMaxSize int = 500

@description('Cache TTL in seconds')
param cacheTtlSeconds int = 3600

@description('Render timeout in milliseconds')
param renderTimeoutMs int = 10000

@description('Rate limit requests per minute (0 = disabled)')
param rateLimitRpm int = 60

@description('Log level')
param logLevel string = 'info'

// ──────────────────────────────────────────────────────────────
// Naming
// ──────────────────────────────────────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id, appName)
var acrName = replace('${appName}acr${uniqueSuffix}', '-', '')
var logAnalyticsName = '${appName}-logs-${uniqueSuffix}'
var envName = '${appName}-env-${uniqueSuffix}'
var containerAppName = appName
var storageAccountName = replace('${appName}st${uniqueSuffix}', '-', '')

// ──────────────────────────────────────────────────────────────
// Azure Container Registry
// ──────────────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: substring(acrName, 0, min(length(acrName), 50))
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ──────────────────────────────────────────────────────────────
// Log Analytics Workspace (required by Container Apps)
// ──────────────────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ──────────────────────────────────────────────────────────────
// Container Apps Environment
// ──────────────────────────────────────────────────────────────

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Storage Account + Blob Containers
// ──────────────────────────────────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: substring(storageAccountName, 0, min(length(storageAccountName), 24))
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource configsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'configs'
}

resource imagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'images'
}

// ──────────────────────────────────────────────────────────────
// Container App (with system-assigned managed identity)
// ──────────────────────────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          image: '${acr.properties.loginServer}/${appName}:${imageTag}'
          resources: {
            cpu: json(cpuCores)
            memory: '${memoryGi}Gi'
          }
          env: [
            { name: 'PORT', value: '3000' }
            { name: 'HOST', value: '0.0.0.0' }
            { name: 'LOG_LEVEL', value: logLevel }
            { name: 'MAX_CONCURRENT_RENDERS', value: string(maxConcurrentRenders) }
            { name: 'CACHE_MAX_SIZE', value: string(cacheMaxSize) }
            { name: 'CACHE_TTL_SECONDS', value: string(cacheTtlSeconds) }
            { name: 'RENDER_TIMEOUT_MS', value: string(renderTimeoutMs) }
            { name: 'RATE_LIMIT_RPM', value: string(rateLimitRpm) }
            { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageAccount.name }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────
// RBAC: Storage Blob Data Contributor for the Container App
// ──────────────────────────────────────────────────────────────

// Storage Blob Data Contributor role ID
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, containerApp.id, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
  }
}

// ──────────────────────────────────────────────────────────────
// Outputs
// ──────────────────────────────────────────────────────────────

output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerAppsEnvName string = containerAppsEnv.name
output containerAppName string = containerApp.name
output storageAccountName string = storageAccount.name
