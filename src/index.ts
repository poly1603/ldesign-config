/**
 * LDesign Config - A powerful Node.js configuration loader plugin
 * 
 * @author LDesign Team
 * @license MIT
 */

// Main configuration loader class
export { LDesignConfig } from './config';

// Configuration definition helpers
export {
  defineConfig,
  defineEnvironmentConfig,
  defineConfigWithEnvironments,
  createConfigFactory,
  defineConfigWithValidation,
  mergeConfigs,
  defineConditionalConfig,
  defineConfigWithEnvSubstitution,
  createConfigSchema
} from './define-config';

// Type definitions
export type {
  ConfigFormat,
  LDesignConfigOptions,
  WatchEventType,
  WatchCallback,
  ConfigFileInfo,
  ConfigResult,
  ConfigParser,
  DeepPartial,
  ConfigDefinition,
  EnvironmentConfig
} from './types';

// Error class
export { ConfigError } from './types';

// Utility functions
export {
  deepMerge,
  conditionalMerge,
  transformMerge,
  validateConfig,
  applyTemplate,
  getConfigFormat,
  parseConfigFileName,
  generateConfigPaths,
  findConfigFiles,
  normalizePath,
  isDirectory,
  isFile,
  getCurrentEnvironment,
  createDebugLogger,
  validateConfigDir,
  getExtensionVariants
} from './utils';

// Utility types
export type {
  MergeStrategy,
  MergeOptions,
  ValidationSchema,
  ConfigTemplate
} from './utils';

// Parser classes and registry
export {
  TypeScriptParser,
  JavaScriptParser,
  JsonParser,
  Json5Parser,
  YamlParser,
  EnvParser,
  ParserRegistry,
  defaultParserRegistry
} from './parsers';

// Watcher classes
export {
  ConfigWatcher,
  DebouncedConfigWatcher,
  SmartConfigWatcher
} from './watcher';



/**
 * Create a new configuration loader instance
 * 
 * @param configName - Name of the configuration (used in file names)
 * @param options - Configuration options
 * @returns LDesignConfig instance
 * 
 * @example
 * ```typescript
 * import { createConfig } from 'ldesign-config';
 * 
 * const config = createConfig('myapp', {
 *   configDir: './config',
 *   watch: true
 * });
 * 
 * const appConfig = await config.getConfig('development');
 * ```
 */
export function createConfig(
  configName: string,
  options?: import('./types').LDesignConfigOptions
): import('./config').LDesignConfig {
  const { LDesignConfig } = require('./config');
  return new LDesignConfig(configName, options);
}

/**
 * Default export for convenience
 */
export { LDesignConfig as default } from './config';

/**
 * Package version
 */
export const version = '1.0.0';

/**
 * Package information
 */
export const packageInfo = {
  name: 'ldesign-config',
  version: '1.0.0',
  description: 'A powerful Node.js configuration loader plugin with multi-format support and hot reload',
  author: 'LDesign Team',
  license: 'MIT',
  repository: 'https://github.com/ldesign/ldesign-config',
  homepage: 'https://github.com/ldesign/ldesign-config#readme'
} as const;