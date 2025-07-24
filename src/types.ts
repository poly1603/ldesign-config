/**
 * Configuration file formats supported by LDesign Config
 */
export type ConfigFormat = 'ts' | 'js' | 'json' | 'json5' | 'yaml' | 'yml' | 'env';

/**
 * Configuration loader options
 */
export interface LDesignConfigOptions {
  /** Configuration files directory, defaults to process.cwd() */
  configDir?: string;
  /** Enable file watching for hot reload, defaults to false */
  watch?: boolean;
  /** Custom file extensions to search for */
  extensions?: ConfigFormat[];
  /** Custom environment variable name, defaults to NODE_ENV */
  envKey?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Configuration merge options */
  mergeOptions?: import('./utils').MergeOptions;
  /** Configuration validation schema */
  validationSchema?: import('./utils').ValidationSchema;
  /** Configuration templates */
  templates?: import('./utils').ConfigTemplate[];
  /** Custom transformers for configuration values */
  transformers?: Record<string, (value: any) => any>;
}

/**
 * File watcher event types
 */
export type WatchEventType = 'add' | 'change' | 'unlink';

/**
 * File watcher callback function
 */
export type WatchCallback = (event: WatchEventType, filePath: string, config?: any) => void;

/**
 * Configuration file metadata
 */
export interface ConfigFileInfo {
  /** File path */
  path: string;
  /** File format */
  format: ConfigFormat;
  /** File extension */
  ext: string;
  /** Environment name (if any) */
  env?: string;
  /** Whether this is a base config file */
  isBase: boolean;
  /** File modification time */
  mtime?: Date;
}

/**
 * Configuration loader result
 */
export interface ConfigResult<T = any> {
  /** Merged configuration object */
  config: T;
  /** List of loaded configuration files */
  files: ConfigFileInfo[];
  /** Environment name */
  env?: string;
}

/**
 * Error types for configuration loading
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly filePath?: string
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Parser interface for different configuration formats
 */
export interface ConfigParser {
  /** Supported file extensions */
  extensions: string[];
  /** Parse configuration file content */
  parse(content: string, filePath: string): Promise<any>;
  /** Check if the parser can handle the file */
  canParse(filePath: string): boolean;
}

/**
 * Deep merge utility type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Configuration definition helper type
 */
export type ConfigDefinition<T = any> = T | (() => T) | (() => Promise<T>);

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig<T = any> {
  /** Base configuration */
  base?: ConfigDefinition<T>;
  /** Development environment configuration */
  development?: ConfigDefinition<DeepPartial<T>>;
  /** Production environment configuration */
  production?: ConfigDefinition<DeepPartial<T>>;
  /** Test environment configuration */
  test?: ConfigDefinition<DeepPartial<T>>;
  /** Custom environment configurations */
  [env: string]: ConfigDefinition<DeepPartial<T>> | undefined;
}