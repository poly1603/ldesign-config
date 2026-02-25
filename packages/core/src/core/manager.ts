import type { ConfigOptions, ConfigSource, ConfigChangeEvent } from '../types'

type ChangeHandler = (event: ConfigChangeEvent) => void

export class ConfigManager {
  private config: Record<string, any> = {}
  private options: Required<ConfigOptions>
  private listeners: Set<ChangeHandler> = new Set()
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(options?: ConfigOptions) {
    this.options = {
      initial: options?.initial ?? {},
      separator: options?.separator ?? '.',
      remoteUrl: options?.remoteUrl ?? '',
      pollInterval: options?.pollInterval ?? 0,
      validator: options?.validator ?? (() => true),
    }
    this.config = this.deepClone(this.options.initial)
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const parts = key.split(this.options.separator)
    let current: any = this.config
    for (const p of parts) { if (current == null) return defaultValue as T; current = current[p] }
    return (current !== undefined ? current : defaultValue) as T
  }

  set(key: string, value: any, source: ConfigSource = 'set'): void {
    const oldValue = this.get(key)
    const parts = key.split(this.options.separator)
    let current: any = this.config
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') current[parts[i]] = {}
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    this.notify({ key, oldValue, newValue: value, source })
  }

  has(key: string): boolean { return this.get(key) !== undefined }

  merge(partial: Record<string, any>, source: ConfigSource = 'merge'): void {
    const old = this.deepClone(this.config)
    this.deepMerge(this.config, partial)
    this.notify({ key: '*', oldValue: old, newValue: this.config, source })
  }

  getAll(): Record<string, any> { return this.deepClone(this.config) }

  reset(): void {
    this.config = this.deepClone(this.options.initial)
    this.notify({ key: '*', oldValue: undefined, newValue: this.config, source: 'initial' })
  }

  onChange(handler: ChangeHandler): () => void {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  async loadRemote(): Promise<void> {
    if (!this.options.remoteUrl) return
    const res = await fetch(this.options.remoteUrl)
    const data = await res.json()
    const v = this.options.validator(data)
    if (v === true) this.merge(data, 'remote')
    else throw new Error(typeof v === 'string' ? v : 'Remote config validation failed')
  }

  startPolling(): void {
    if (this.options.pollInterval <= 0 || !this.options.remoteUrl) return
    this.pollTimer = setInterval(() => this.loadRemote().catch(() => {}), this.options.pollInterval)
  }

  stopPolling(): void { if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null } }

  destroy(): void { this.stopPolling(); this.listeners.clear() }

  private notify(event: ConfigChangeEvent): void { this.listeners.forEach(h => h(event)) }
  private deepClone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)) }
  private deepMerge(target: any, source: any): void {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {}
        this.deepMerge(target[key], source[key])
      } else target[key] = source[key]
    }
  }
}
