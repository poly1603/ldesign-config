export interface ConfigOptions {
  initial?: Record<string, any>
  separator?: string
  remoteUrl?: string
  pollInterval?: number
  validator?: (config: Record<string, any>) => boolean | string
}

export type ConfigSource = 'initial' | 'set' | 'remote' | 'merge'

export interface ConfigChangeEvent {
  key: string
  oldValue: any
  newValue: any
  source: ConfigSource
}
