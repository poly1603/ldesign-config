import { resolve, extname, basename } from 'path';
import { existsSync, statSync } from 'fs';
import type { ConfigFormat, ConfigFileInfo, DeepPartial } from './types';

/**
 * Configuration merge strategy
 */
export type MergeStrategy = 'deep' | 'shallow' | 'replace' | 'append' | 'prepend';

/**
 * Configuration merge options
 */
export interface MergeOptions {
  strategy?: MergeStrategy;
  arrayMergeStrategy?: 'replace' | 'concat' | 'unique';
  customMergers?: Record<string, (target: any, source: any) => any>;
  skipKeys?: string[];
  onlyKeys?: string[];
}

/**
 * Enhanced deep merge with configurable strategies
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>,
  options: MergeOptions = {}
): T {
  const {
    strategy = 'deep',
    arrayMergeStrategy = 'replace',
    customMergers = {},
    skipKeys = [],
    onlyKeys
  } = options;

  if (strategy === 'shallow') {
    return { ...target, ...source };
  }

  if (strategy === 'replace') {
    return source as T;
  }

  const result = { ...target };

  for (const key in source) {
    // Skip keys if specified
    if (skipKeys.includes(key)) {
      continue;
    }

    // Only process specified keys if onlyKeys is provided
    if (onlyKeys && !onlyKeys.includes(key)) {
      continue;
    }

    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    // Use custom merger if available
    if (customMergers[key]) {
      result[key] = customMergers[key](targetValue, sourceValue);
      continue;
    }

    // Handle arrays
    if (Array.isArray(sourceValue)) {
      if (Array.isArray(targetValue)) {
        switch (arrayMergeStrategy) {
          case 'concat':
            result[key] = [...targetValue, ...sourceValue];
            break;
          case 'unique':
            result[key] = [...new Set([...targetValue, ...sourceValue])];
            break;
          case 'replace':
          default:
            result[key] = sourceValue;
            break;
        }
      } else {
        result[key] = sourceValue;
      }
      continue;
    }

    // Handle objects
    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue, options);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Conditional merge based on environment or conditions
 */
export function conditionalMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>,
  condition: boolean | ((key: string, value: any) => boolean),
  options?: MergeOptions
): T {
  if (typeof condition === 'boolean') {
    return condition ? deepMerge(target, source, options) : target;
  }

  const filteredSource: DeepPartial<T> = {};
  for (const key in source) {
    if (condition(key, source[key])) {
      filteredSource[key] = source[key];
    }
  }

  return deepMerge(target, filteredSource, options);
}

/**
 * Transform configuration values during merge
 */
export function transformMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>,
  transformers: Record<string, (value: any) => any>,
  options?: MergeOptions
): T {
  function applyTransformers(obj: any, path: string = ''): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      const transformer = transformers[path];
      return transformer ? transformer(obj) : obj;
    }

    const result: any = {};
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Check if there's a transformer for this path
      const transformer = transformers[currentPath] || transformers[key];
      if (transformer) {
        result[key] = transformer(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = applyTransformers(value, currentPath);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Transform both target and source
  const transformedTarget = applyTransformers(target);
  const transformedSource = applyTransformers(source);
  return deepMerge(transformedTarget, transformedSource, options);
}

/**
 * Get configuration file format from file extension
 */
export function getConfigFormat(filePath: string): ConfigFormat | null {
  const ext = extname(filePath).slice(1).toLowerCase();
  
  switch (ext) {
    case 'ts':
      return 'ts';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'js';
    case 'json':
      return 'json';
    case 'json5':
      return 'json5';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'env':
      return 'env';
    default:
      return null;
  }
}

/**
 * Parse configuration file name to extract base name and environment
 */
export function parseConfigFileName(filePath: string): {
  baseName: string;
  env?: string;
  format: ConfigFormat | null;
} {
  const fileName = basename(filePath, extname(filePath));
  const format = getConfigFormat(filePath);
  
  // Pattern: {name}.config.{env}.{ext} or {name}.config.{ext}
  const configPattern = /^(.+)\.config(?:\.([^.]+))?$/;
  const match = fileName.match(configPattern);
  
  if (match) {
    const [, baseName, env] = match;
    return { baseName, env, format };
  }
  
  return { baseName: fileName, format };
}

/**
 * Generate possible configuration file paths
 */
export function generateConfigPaths(
  configDir: string,
  name: string,
  env?: string,
  extensions: ConfigFormat[] = ['ts', 'js', 'json', 'json5', 'yaml', 'yml', 'env']
): string[] {
  const paths: string[] = [];
  
  for (const ext of extensions) {
    if (env) {
      // Environment-specific config: {name}.config.{env}.{ext}
      paths.push(resolve(configDir, `${name}.config.${env}.${ext}`));
    } else {
      // Base config: {name}.config.{ext}
      paths.push(resolve(configDir, `${name}.config.${ext}`));
    }
  }
  
  return paths;
}

/**
 * Find existing configuration files
 */
export function findConfigFiles(
  name: string,
  configDir: string,
  env?: string,
  extensions?: ConfigFormat[]
): ConfigFileInfo[] {
  const files: ConfigFileInfo[] = [];
  
  // Always find base config files first
  const basePaths = generateConfigPaths(configDir, name, undefined, extensions);
  for (const path of basePaths) {
    if (existsSync(path)) {
      const format = getConfigFormat(path);
      if (format) {
        const stat = statSync(path);
        files.push({
          path,
          format,
          ext: extname(path),
          isBase: true,
          mtime: stat.mtime
        });
      }
    }
  }
  
  // Find environment-specific config files if env is specified
  if (env) {
    const envPaths = generateConfigPaths(configDir, name, env, extensions);
    for (const path of envPaths) {
      if (existsSync(path)) {
        const format = getConfigFormat(path);
        if (format) {
          const stat = statSync(path);
          files.push({
            path,
            format,
            ext: extname(path),
            env,
            isBase: false,
            mtime: stat.mtime
          });
        }
      }
    }
  }
  
  // Sort by priority (env < yml < yaml < json5 < json < js < ts)
  // Lower priority files come first, so higher priority files can override them
  const priorityOrder = ['env', 'yml', 'yaml', 'json5', 'json', 'js', 'ts'];
  files.sort((a, b) => {
    const indexA = priorityOrder.indexOf(a.format);
    const indexB = priorityOrder.indexOf(b.format);
    return indexA - indexB;
  });
  
  return files;
}

/**
 * Normalize file path for cross-platform compatibility
 */
export function normalizePath(filePath: string): string {
  return resolve(filePath).replace(/\\/g, '/');
}

/**
 * Check if a path is a directory
 */
export function isDirectory(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export function isFile(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Configuration validation schema
 */
export interface ValidationSchema {
  [key: string]: {
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validator?: (value: any) => boolean | string;
    transform?: (value: any) => any;
    children?: ValidationSchema;
  };
}

/**
 * Validate configuration against schema
 */
export function validateConfig<T extends Record<string, any>>(
  config: T,
  schema: ValidationSchema
): { isValid: boolean; errors: string[]; validated: T } {
  const errors: string[] = [];
  const validated = { ...config };

  function validateValue(value: any, key: string, rule: ValidationSchema[string], path: string = key): any {
    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`${path} is required`);
      return rule.default;
    }

    // Use default if value is undefined
    if (value === undefined && rule.default !== undefined) {
      return rule.default;
    }

    if (value === undefined) {
      return value;
    }

    // Transform value
    if (rule.transform) {
      value = rule.transform(value);
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`${path} should be ${rule.type}, got ${actualType}`);
        return rule.default;
      }
    }

    // Custom validator
    if (rule.validator) {
      const result = rule.validator(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${path} validation failed`);
        return rule.default;
      }
    }

    // Validate children for objects
    if (rule.children && typeof value === 'object' && !Array.isArray(value)) {
      const childResult = validateConfig(value, rule.children);
      errors.push(...childResult.errors.map(err => `${path}.${err}`));
      return childResult.validated;
    }

    return value;
  }

  for (const [key, rule] of Object.entries(schema)) {
    validated[key] = validateValue(config[key], key, rule);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validated
  };
}

/**
 * Configuration template system
 */
export interface ConfigTemplate {
  name: string;
  description?: string;
  condition: (config: any) => boolean;
  template: Record<string, any>;
}

/**
 * Apply template to configuration
 */
export function applyTemplate(
  config: Record<string, any>,
  template: ConfigTemplate
): Record<string, any> {
  if (!template.condition(config)) {
    return config;
  }
  
  return deepMerge(config, template.template);
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(envKey: string = 'NODE_ENV'): string | undefined {
  return process.env[envKey];
}

/**
 * Create debug logger
 */
export function createDebugLogger(enabled: boolean, prefix: string = '') {
  return enabled
    ? (message: string, ...args: any[]) => {
        console.log(`[${prefix}] ${message}`, ...args);
      }
    : () => {};
}

/**
 * Validate configuration directory
 */
export function validateConfigDir(configDir: string): void {
  if (!existsSync(configDir)) {
    throw new Error(`Configuration directory does not exist: ${configDir}`);
  }
  
  if (!isDirectory(configDir)) {
    throw new Error(`Configuration path is not a directory: ${configDir}`);
  }
}



/**
 * Get file extension variants for a given format
 */
export function getExtensionVariants(format: ConfigFormat): string[] {
  switch (format) {
    case 'js':
      return ['js', 'mjs', 'cjs'];
    case 'yaml':
      return ['yaml', 'yml'];
    case 'json5':
      return ['json5'];
    default:
      return [format];
  }
}

/**
 * Resolve configuration file path
 */
export function resolveConfigPath(fileName: string, basePath: string = process.cwd()): string {
  // Handle tilde paths
  if (fileName.startsWith('~/')) {
    const os = require('os');
    return resolve(os.homedir(), fileName.slice(2));
  }
  
  // If already absolute path, return as is
  if (resolve(fileName) === fileName) {
    return fileName;
  }
  
  // Resolve relative path against base path
  return resolve(basePath, fileName);
}