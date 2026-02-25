import { ConfigManager } from './manager'
import type { ConfigOptions } from '../types'

/**
 * 环境配置定义
 */
export interface EnvConfigMap {
  /** 基础配置（所有环境共用） */
  base: Record<string, any>
  /** 开发环境配置 */
  development?: Record<string, any>
  /** 测试环境配置 */
  staging?: Record<string, any>
  /** 生产环境配置 */
  production?: Record<string, any>
  /** 自定义环境配置 */
  [env: string]: Record<string, any> | undefined
}

/**
 * 环境配置选项
 */
export interface EnvConfigOptions extends Omit<ConfigOptions, 'initial'> {
  /** 环境配置映射 */
  configs: EnvConfigMap
  /** 当前环境名称（默认从 NODE_ENV 或 import.meta.env.MODE 获取） */
  env?: string
}

/**
 * 获取当前环境名称
 *
 * 依次尝试：
 * 1. 传入的 env 参数
 * 2. import.meta.env.MODE（Vite）
 * 3. process.env.NODE_ENV（Node.js）
 * 4. 默认 'development'
 */
function resolveEnv(env?: string): string {
  if (env) return env

  // Vite 环境
  try {
    if (typeof (import.meta as any)?.env?.MODE === 'string') {
      return (import.meta as any).env.MODE
    }
  } catch { /* 忽略 */ }

  // Node.js 环境
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV
    }
  } catch { /* 忽略 */ }

  return 'development'
}

/**
 * 深度合并配置
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * 加载环境配置
 *
 * 将 base 配置与当前环境配置合并，环境配置会覆盖 base 中的同名项
 *
 * @param configs - 环境配置映射
 * @param env - 当前环境名称（可选）
 * @returns 合并后的配置对象
 *
 * @example
 * ```ts
 * const config = loadEnvConfig({
 *   base: { api: { timeout: 10000 } },
 *   development: { api: { timeout: 30000, debug: true } },
 *   production: { api: { timeout: 5000 } },
 * })
 * // 开发环境结果: { api: { timeout: 30000, debug: true } }
 * ```
 */
export function loadEnvConfig(configs: EnvConfigMap, env?: string): Record<string, any> {
  const currentEnv = resolveEnv(env)
  const base = configs.base || {}
  const envOverlay = configs[currentEnv] || {}

  return deepMerge(base, envOverlay)
}

/**
 * 创建基于环境的配置管理器
 *
 * @param options - 环境配置选项
 * @returns ConfigManager 实例，已加载对应环境的合并配置
 *
 * @example
 * ```ts
 * const manager = createEnvConfigManager({
 *   configs: {
 *     base: { app: { name: 'MyApp' }, api: { timeout: 10000 } },
 *     development: { api: { timeout: 30000, debug: true } },
 *     production: { api: { timeout: 5000 } },
 *   },
 * })
 *
 * manager.get('api.timeout') // 开发环境: 30000, 生产环境: 5000
 * ```
 */
export function createEnvConfigManager(options: EnvConfigOptions): ConfigManager {
  const { configs, env, ...managerOptions } = options
  const merged = loadEnvConfig(configs, env)

  return new ConfigManager({
    ...managerOptions,
    initial: merged,
  })
}
