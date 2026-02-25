import { ref, onUnmounted, inject } from 'vue'
import { ConfigManager } from '@ldesign/config-core'

export function useConfig<T = any>(key: string, defaultValue?: T) {
  const manager = inject<ConfigManager>('ldesign-config') || new ConfigManager()
  const value = ref(manager.get<T>(key, defaultValue as T))

  const unsub = manager.onChange((event) => {
    if (event.key === key || event.key === '*') value.value = manager.get<T>(key, defaultValue as T)
  })

  onUnmounted(() => unsub())

  function set(newValue: T) { manager.set(key, newValue); value.value = newValue as any }

  return { value, set }
}
