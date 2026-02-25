import type { App } from 'vue'
import { inject } from 'vue'
import { ConfigManager } from '@ldesign/config-core'
import type { ConfigOptions } from '@ldesign/config-core'

export function createConfigPlugin(options?: ConfigOptions) {
  const manager = new ConfigManager(options)
  return {
    install(app: App) {
      app.provide('ldesign-config', manager)
      app.config.globalProperties.$config = manager
    },
    manager,
  }
}

export function useConfigManager(): ConfigManager {
  const manager = inject<ConfigManager>('ldesign-config')
  if (!manager) throw new Error('ConfigManager not provided. Use createConfigPlugin().')
  return manager
}
