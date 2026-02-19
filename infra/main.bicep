// ──────────────────────────────────────────────────────────────
// chartcn — Azure Infrastructure (Bicep)
//
// Deploys:
//   1. Azure Container Registry (ACR)
//   2. Log Analytics Workspace
//   3. Container Apps Environment
//   4. Container App (chartcn)
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
// Container App
// ──────────────────────────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
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
// Outputs
// ──────────────────────────────────────────────────────────────

output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerAppsEnvName string = containerAppsEnv.name
output containerAppName string = containerApp.name
