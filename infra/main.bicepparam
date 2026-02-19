using './main.bicep'

// Override these per environment as needed.
// Defaults are suitable for a low-cost development/staging deployment.

param location = 'eastus'
param appName = 'chartcn'
param imageTag = 'latest'
param cpuCores = '1.0'
param memoryGi = '2.0'
param minReplicas = 0
param maxReplicas = 3
param maxConcurrentRenders = 5
param cacheMaxSize = 500
param cacheTtlSeconds = 3600
param renderTimeoutMs = 10000
param rateLimitRpm = 60
param logLevel = 'info'
