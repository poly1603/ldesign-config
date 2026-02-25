import type { ConfigEnginePluginOptions } from './types'
import { ConfigManager } from '../core/manager'

export const configStateKeys = {
  MANAGER: 'config:manager' as const,
} as const

export const configEventKeys = {
  INSTALLED: 'config:installed' as const,
  UNINSTALLED: 'config:uninstalled' as const,
  CHANGED: 'config:changed' as const,
} as const

export function createConfigEnginePlugin(options: ConfigEnginePluginOptions = {}) {
  let manager: ConfigManager | null = null

  return {
    name: 'config',
    version: '1.0.0',
    dependencies: options.dependencies ?? [],

    async install(context: any) {
      const engine = context.engine || context
      manager = new ConfigManager(options)
      manager.onChange((e) => engine.events?.emit(configEventKeys.CHANGED, e))
      engine.state?.set(configStateKeys.MANAGER, manager)
      engine.events?.emit(configEventKeys.INSTALLED, { name: 'config' })
      engine.logger?.info('[Config Plugin] installed')
    },

    async uninstall(context: any) {
      const engine = context.engine || context
      manager?.destroy()
      manager = null
      engine.state?.delete(configStateKeys.MANAGER)
      engine.events?.emit(configEventKeys.UNINSTALLED, {})
    },
  }
}
