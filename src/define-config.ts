import type { ConfigDefinition, EnvironmentConfig, DeepPartial } from './types';

/**
 * Define configuration with TypeScript support
 * Provides type hints and intellisense for configuration files
 */
export function defineConfig<T = any>(config: ConfigDefinition<T>): ConfigDefinition<T> {
  return config;
}

/**
 * Define environment-specific configuration
 * Allows defining different configurations for different environments
 */
export function defineEnvironmentConfig<T = any>(
  config: EnvironmentConfig<T>
): EnvironmentConfig<T> {
  return config;
}

/**
 * Define base configuration with environment overrides
 * Provides a structured way to define base config and environment-specific overrides
 */
export function defineConfigWithEnvironments<T = any>(config: {
  base: ConfigDefinition<T>;
  environments?: {
    development?: ConfigDefinition<DeepPartial<T>>;
    production?: ConfigDefinition<DeepPartial<T>>;
    test?: ConfigDefinition<DeepPartial<T>>;
    [env: string]: ConfigDefinition<DeepPartial<T>> | undefined;
  };
}): EnvironmentConfig<T> {
  const result: EnvironmentConfig<T> = {
    base: config.base
  };

  if (config.environments) {
    Object.assign(result, config.environments);
  }

  return result;
}

/**
 * Create a configuration factory function
 * Useful for dynamic configuration generation
 */
export function createConfigFactory<T = any>(
  factory: (env?: string) => T | Promise<T>
): (env?: string) => Promise<T> {
  return async (env?: string) => {
    const result = factory(env);
    return Promise.resolve(result);
  };
}

/**
 * Define configuration with validation
 * Allows adding runtime validation to configuration
 */
export function defineConfigWithValidation<T = any>(
  config: ConfigDefinition<T>,
  validator: (config: T) => boolean | string | Promise<boolean | string>
): ConfigDefinition<T> {
  if (typeof config === 'function') {
    return async () => {
      const result = await Promise.resolve((config as () => T | Promise<T>)());
      const validation = await Promise.resolve(validator(result));
      
      if (validation !== true) {
        throw new Error(
          typeof validation === 'string' 
            ? validation 
            : 'Configuration validation failed'
        );
      }
      
      return result;
    };
  }
  
  return config;
}

/**
 * Merge multiple configuration objects
 * Useful for composing configurations from multiple sources
 */
export function mergeConfigs<T extends Record<string, any> = any>(...configs: ConfigDefinition<DeepPartial<T>>[]): ConfigDefinition<T> {
  return async () => {
    let result = {} as T;
    
    for (const config of configs) {
      const resolved = typeof config === 'function' 
        ? await Promise.resolve(config())
        : config;
      
      result = deepMergeHelper(result, resolved);
    }
    
    return result;
  };
}

/**
 * Helper function for deep merging (simplified version)
 */
function deepMergeHelper<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMergeHelper(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Create a conditional configuration
 * Allows different configurations based on conditions
 */
export function defineConditionalConfig<T = any>(
  conditions: Array<{
    condition: boolean | (() => boolean) | (() => Promise<boolean>);
    config: ConfigDefinition<T>;
  }>,
  fallback?: ConfigDefinition<T>
): ConfigDefinition<T> {
  return async () => {
    for (const { condition, config } of conditions) {
      const shouldUse = typeof condition === 'function'
        ? await Promise.resolve((condition as () => boolean | Promise<boolean>)())
        : condition;
      
      if (shouldUse) {
        return typeof config === 'function'
          ? await Promise.resolve((config as () => T | Promise<T>)())
          : config as T;
      }
    }
    
    if (fallback) {
      return typeof fallback === 'function'
        ? await Promise.resolve((fallback as () => T | Promise<T>)())
        : fallback as T;
    }
    
    throw new Error('No matching condition found and no fallback provided');
  };
}

/**
 * Define configuration with environment variable substitution
 * Allows using environment variables in configuration
 */
export function defineConfigWithEnvSubstitution<T = any>(
  config: ConfigDefinition<T>,
  envPrefix = ''
): ConfigDefinition<T> {
  return async () => {
    const resolved = typeof config === 'function'
      ? await Promise.resolve((config as () => T | Promise<T>)())
      : config as T;
    
    return substituteEnvVariables(resolved, envPrefix);
  };
}

/**
 * Substitute environment variables in configuration object
 */
function substituteEnvVariables(obj: any, envPrefix: string): any {
  if (typeof obj === 'string') {
    // Replace ${VAR_NAME} or ${PREFIX_VAR_NAME} with environment variables
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const fullVarName = envPrefix ? `${envPrefix}${varName}` : varName;
      return process.env[fullVarName] || match;
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => substituteEnvVariables(item, envPrefix));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVariables(value, envPrefix);
    }
    return result;
  }
  
  return obj;
}

/**
 * Create a configuration schema validator
 * Provides basic schema validation for configurations
 */
export function createConfigSchema<T = any>(schema: {
  [K in keyof T]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: T[K];
    validator?: (value: T[K]) => boolean;
  };
}) {
  return {
    validate(config: any): T {
      const result = {} as T;
      
      for (const [key, rules] of Object.entries(schema) as Array<[string, any]>) {
        const value = config[key];
        
        // Check required fields
        if (rules.required && (value === undefined || value === null)) {
          throw new Error(`Required configuration field '${key}' is missing`);
        }
        
        // Use default value if not provided
        if (value === undefined && rules.default !== undefined) {
          result[key as keyof T] = rules.default;
          continue;
        }
        
        // Skip validation if value is undefined and not required
        if (value === undefined) {
          continue;
        }
        
        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          throw new Error(
            `Configuration field '${key}' should be of type '${rules.type}', got '${actualType}'`
          );
        }
        
        // Custom validation
        if (rules.validator && !rules.validator(value)) {
          throw new Error(`Configuration field '${key}' failed custom validation`);
        }
        
        result[key as keyof T] = value;
      }
      
      return result;
    },
    
    createValidator() {
      return (config: any) => {
        try {
          this.validate(config);
          return true;
        } catch (error) {
          return error instanceof Error ? error.message : 'Validation failed';
        }
      };
    }
  };
}