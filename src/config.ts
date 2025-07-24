import { resolve } from 'path';
import { EventEmitter } from 'events';
import type {
  LDesignConfigOptions,
  ConfigResult,
  ConfigFileInfo,
  WatchCallback,
  ConfigFormat,
  ConfigError
} from './types';
import {
  findConfigFiles,
  deepMerge,
  conditionalMerge,
  transformMerge,
  validateConfig,
  applyTemplate,
  getCurrentEnvironment,
  createDebugLogger,
  validateConfigDir,
  type MergeOptions,
  type ValidationSchema,
  type ConfigTemplate
} from './utils';
import { defaultParserRegistry, ParserRegistry } from './parsers';
import { SmartConfigWatcher } from './watcher';

/**
 * Main configuration loader class
 */
export class LDesignConfig extends EventEmitter {
  private configDir: string;
  private configName: string;
  private options: Required<LDesignConfigOptions>;
  private watcher: SmartConfigWatcher | null = null;
  private parserRegistry: ParserRegistry;
  private debug: (message: string, ...args: any[]) => void;
  private configCache = new Map<string, ConfigResult>();

  constructor(configName: string, options: LDesignConfigOptions = {}) {
    super();
    
    this.configName = configName;
    this.configDir = resolve(options.configDir || process.cwd());
    
    // Set default options
    this.options = {
      configDir: this.configDir,
      watch: options.watch || false,
      extensions: options.extensions || ['ts', 'js', 'json', 'json5', 'yaml', 'yml', 'env'],
      envKey: options.envKey || 'NODE_ENV',
      debug: options.debug || false,
      mergeOptions: options.mergeOptions || {},
      validationSchema: options.validationSchema,
      templates: options.templates || [],
      transformers: options.transformers || {}
    };
    
    this.debug = createDebugLogger(this.options.debug, 'ldesign-config');
    this.parserRegistry = defaultParserRegistry;
    
    // Validate configuration directory
    try {
      validateConfigDir(this.configDir);
    } catch (error) {
      this.debug('Config directory validation failed:', error);
    }
    
    this.debug('Initialized LDesignConfig:', {
      configName: this.configName,
      configDir: this.configDir,
      options: this.options
    });
  }

  /**
   * Get configuration for a specific environment
   */
  async getConfig<T extends Record<string, any> = any>(env?: string): Promise<ConfigResult<T>> {
    const targetEnv = env || getCurrentEnvironment(this.options.envKey);
    const cacheKey = targetEnv || 'default';
    
    this.debug('Getting config for environment:', targetEnv);
    
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      const cached = this.configCache.get(cacheKey)!;
      this.debug('Returning cached config for:', cacheKey);
      return cached as ConfigResult<T>;
    }
    
    try {
      const result = await this.loadConfig<T>(targetEnv);
      
      // Cache the result
      this.configCache.set(cacheKey, result);
      
      // Set up file watching if enabled
      if (this.options.watch && !this.watcher) {
        this.setupWatcher(result.files, targetEnv);
      }
      
      this.debug('Config loaded successfully:', {
        env: targetEnv,
        filesCount: result.files.length,
        configKeys: Object.keys(result.config as Record<string, any>)
      });
      
      return result;
    } catch (error) {
      this.debug('Failed to load config:', error);
      throw error;
    }
  }

  /**
   * Reload configuration and clear cache
   */
  async reloadConfig<T extends Record<string, any> = any>(env?: string): Promise<ConfigResult<T>> {
    const targetEnv = env || getCurrentEnvironment(this.options.envKey);
    const cacheKey = targetEnv || 'default';
    
    this.debug('Reloading config for environment:', targetEnv);
    
    // Clear cache
    this.configCache.delete(cacheKey);
    
    // Load fresh config
    const result = await this.getConfig<T>(targetEnv);
    
    // Emit reload event
    this.emit('reload', result, targetEnv);
    
    return result;
  }

  /**
   * Enable file watching
   */
  enableWatch(callback?: WatchCallback): void {
    if (this.watcher) {
      this.debug('Watcher already enabled');
      return;
    }
    
    this.options.watch = true;
    this.debug('Enabling file watching');
    
    // If we have cached configs, set up watcher for them
    for (const [env, result] of this.configCache.entries()) {
      this.setupWatcher(result.files, env === 'default' ? undefined : env, callback);
      break; // Set up watcher once
    }
  }

  /**
   * Disable file watching
   */
  async disableWatch(): Promise<void> {
    if (!this.watcher) {
      return;
    }
    
    this.debug('Disabling file watching');
    this.options.watch = false;
    
    await this.watcher.stop();
    this.watcher = null;
  }

  /**
   * Get current configuration directory
   */
  getConfigDir(): string {
    return this.configDir;
  }

  /**
   * Get configuration name
   */
  getConfigName(): string {
    return this.configName;
  }

  /**
   * Get current options
   */
  getOptions(): Required<LDesignConfigOptions> {
    return { ...this.options };
  }

  /**
   * Check if file watching is enabled
   */
  isWatchEnabled(): boolean {
    return this.options.watch && this.watcher !== null;
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return this.watcher ? this.watcher.getWatchedFiles() : [];
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.debug('Clearing configuration cache');
    this.configCache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return getCurrentEnvironment(this.options.envKey);
  }

  /**
   * Apply configuration templates
   */
  async applyTemplates<T extends Record<string, any> = any>(config: T): Promise<T> {
    let result = config;
    
    for (const template of this.options.templates) {
      result = applyTemplate(result, template);
    }
    
    return result;
  }

  /**
   * Validate configuration against schema
   */
  validateConfiguration<T extends Record<string, any> = any>(config: T): { isValid: boolean; errors: string[]; validated: T } {
    if (!this.options.validationSchema) {
      return { isValid: true, errors: [], validated: config };
    }
    
    return validateConfig(config, this.options.validationSchema);
  }

  /**
   * Merge configurations with custom strategy
   */
  mergeConfigurations<T extends Record<string, any> = any>(
    target: T,
    source: T,
    options?: MergeOptions
  ): T {
    return deepMerge(target, source, options || this.options.mergeOptions);
  }

  /**
   * Destroy the configuration loader
   */
  async destroy(): Promise<void> {
    this.debug('Destroying LDesignConfig instance');
    
    await this.disableWatch();
    this.clearCache();
    this.removeAllListeners();
  }

  /**
   * Load configuration files and merge them
   */
  private async loadConfig<T extends Record<string, any> = any>(env?: string): Promise<ConfigResult<T>> {
    // Find configuration files
    const files = findConfigFiles(
      this.configName,
      this.configDir,
      env,
      this.options.extensions
    );
    
    if (files.length === 0) {
      this.debug('No configuration files found, using empty config');
      let mergedConfig: T = {} as T;
      
      // Apply validation even for empty config if schema is provided
      if (this.options.validationSchema) {
        const validation = validateConfig(mergedConfig, this.options.validationSchema);
        if (!validation.isValid) {
          throw new Error(
           `Configuration validation failed: ${validation.errors.join(', ')}`
         );
        }
        mergedConfig = validation.validated;
      }
      
      return {
        config: mergedConfig,
        files: [],
        env
      };
    }
    
    this.debug('Found config files:', files.map(f => f.path));
    
    // Load and parse configuration files
    const configs: any[] = [];
    
    // Load base configs first
    const baseFiles = files.filter(f => f.isBase);
    for (const file of baseFiles) {
      try {
        let config = await this.parserRegistry.parseFile(file.path);
        config = await this.resolveConfig(config);
        
        // Apply transformers if available
        if (Object.keys(this.options.transformers).length > 0) {
          config = transformMerge(config, config, this.options.transformers);
        }
        
        configs.push(config);
        this.debug('Loaded base config:', file.path);
      } catch (error) {
        this.debug('Failed to load base config:', file.path, error);
        throw error;
      }
    }
    
    // Load environment-specific configs
    const envFiles = files.filter(f => !f.isBase && f.env === env);
    for (const file of envFiles) {
      try {
        let config = await this.parserRegistry.parseFile(file.path);
        config = await this.resolveConfig(config);
        
        // Apply transformers if available
        if (Object.keys(this.options.transformers).length > 0) {
          config = transformMerge(config, config, this.options.transformers);
        }
        
        configs.push(config);
        this.debug('Loaded env config:', file.path);
      } catch (error) {
        this.debug('Failed to load env config:', file.path, error);
        throw error;
      }
    }
    
    // Merge configurations (base first, then environment-specific)
    let mergedConfig: T = {} as T;
    for (const config of configs) {
      mergedConfig = deepMerge(mergedConfig, config, this.options.mergeOptions);
    }
    
    // Apply validation if schema is provided
    if (this.options.validationSchema) {
      const validation = validateConfig(mergedConfig, this.options.validationSchema);
      if (!validation.isValid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.join(', ')}`
        );
      }
      mergedConfig = validation.validated;
    }
    
    return {
      config: mergedConfig,
      files,
      env
    };
  }

  /**
   * Resolve configuration (handle functions and promises)
   */
  private async resolveConfig(config: any): Promise<any> {
    if (typeof config === 'function') {
      const result = config();
      return Promise.resolve(result);
    }
    return config;
  }

  /**
   * Set up file watcher
   */
  private setupWatcher(
    files: ConfigFileInfo[],
    env?: string,
    callback?: WatchCallback
  ): void {
    if (this.watcher) {
      return;
    }
    
    this.watcher = new SmartConfigWatcher(
      this.configDir,
      this.configName,
      env,
      300, // 300ms debounce
      { debug: this.options.debug }
    );
    
    // Set up watch callback
    const watchCallback: WatchCallback = async (eventType, filePath, _config) => {
      this.debug('File change detected:', eventType, filePath);
      
      try {
        // Clear cache and reload
        this.clearCache();
        const result = await this.loadConfig(env);
        
        // Emit change event
        this.emit('change', eventType, filePath, result);
        
        // Call user callback if provided
        if (callback) {
          callback(eventType, filePath, result.config);
        }
      } catch (error) {
        this.debug('Error during config reload:', error);
        this.emit('error', error);
      }
    };
    
    // Start watching
    this.watcher.smartWatch(files, watchCallback);
    
    // Forward watcher events
    this.watcher.on('error', (error) => this.emit('error', error));
    this.watcher.on('ready', () => this.emit('watchReady'));
  }
}