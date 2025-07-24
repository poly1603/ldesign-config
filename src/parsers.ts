import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import * as yaml from 'js-yaml';
import * as JSON5 from 'json5';
// import { config as dotenvConfig } from 'dotenv';
import type { ConfigParser } from './types';
import { ConfigError } from './types';

/**
 * TypeScript configuration parser
 */
export class TypeScriptParser implements ConfigParser {
  extensions = ['ts'];

  canParse(filePath: string): boolean {
    return filePath.endsWith('.ts');
  }

  async parse(_content: string, filePath: string): Promise<any> {
    try {
      // For TypeScript files, we need to compile them first
      // In a real implementation, you might want to use ts-node or esbuild
      // For now, we'll use dynamic import after transpilation
      
      // Try to import the TypeScript file directly (requires ts-node or similar)
      const fileUrl = pathToFileURL(filePath).href;
      // Add timestamp to bypass module cache
      const module = await import(`${fileUrl}?t=${Date.now()}`);
      
      // Return default export or the entire module
      return module.default || module;
    } catch (error) {
      throw new ConfigError(
        `Failed to parse TypeScript config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TS_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * JavaScript configuration parser
 */
export class JavaScriptParser implements ConfigParser {
  extensions = ['js', 'mjs', 'cjs'];

  canParse(filePath: string): boolean {
    return /\.(js|mjs|cjs)$/.test(filePath);
  }

  async parse(_content: string, filePath: string): Promise<any> {
    try {
      // Clear require cache to ensure fresh load
      const resolvedPath = require.resolve(filePath);
      delete require.cache[resolvedPath];
      
      if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) {
        // ES modules
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(`${fileUrl}?t=${Date.now()}`);
        return module.default || module;
      } else {
        // CommonJS
        const module = require(filePath);
        return module.default || module;
      }
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JavaScript config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'JS_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * JSON configuration parser
 */
export class JsonParser implements ConfigParser {
  extensions = ['json'];

  canParse(filePath: string): boolean {
    return filePath.endsWith('.json');
  }

  async parse(content: string, filePath: string): Promise<any> {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JSON config: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
        'JSON_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * JSON5 configuration parser
 */
export class Json5Parser implements ConfigParser {
  extensions = ['json5'];

  canParse(filePath: string): boolean {
    return filePath.endsWith('.json5');
  }

  async parse(content: string, filePath: string): Promise<any> {
    try {
      return JSON5.parse(content);
    } catch (error) {
      throw new ConfigError(
        `Failed to parse JSON5 config: ${error instanceof Error ? error.message : 'Invalid JSON5'}`,
        'JSON5_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * YAML configuration parser
 */
export class YamlParser implements ConfigParser {
  extensions = ['yaml', 'yml'];

  canParse(filePath: string): boolean {
    return /\.(yaml|yml)$/.test(filePath);
  }

  async parse(content: string, filePath: string): Promise<any> {
    try {
      return yaml.load(content) || {};
    } catch (error) {
      throw new ConfigError(
        `Failed to parse YAML config: ${error instanceof Error ? error.message : 'Invalid YAML'}`,
        'YAML_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * Environment variables parser
 */
export class EnvParser implements ConfigParser {
  extensions = ['env'];

  canParse(filePath: string): boolean {
    return filePath.endsWith('.env');
  }

  async parse(content: string, filePath: string): Promise<any> {
    try {
      // Parse .env file content
      const result: Record<string, string> = {};
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }
        
        // Parse key=value pairs
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex === -1) {
          continue;
        }
        
        const key = trimmed.slice(0, equalIndex).trim();
        let value = trimmed.slice(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        result[key] = value;
      }
      
      return result;
    } catch (error) {
      throw new ConfigError(
        `Failed to parse ENV config: ${error instanceof Error ? error.message : 'Invalid ENV format'}`,
        'ENV_PARSE_ERROR',
        filePath
      );
    }
  }
}

/**
 * Parser registry for managing different configuration parsers
 */
export class ParserRegistry {
  private parsers: ConfigParser[] = [];

  constructor() {
    // Register default parsers
    this.register(new TypeScriptParser());
    this.register(new JavaScriptParser());
    this.register(new JsonParser());
    this.register(new Json5Parser());
    this.register(new YamlParser());
    this.register(new EnvParser());
  }

  /**
   * Register a new parser
   */
  register(parser: ConfigParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get parser for a specific file
   */
  getParser(filePath: string): ConfigParser | null {
    return this.parsers.find(parser => parser.canParse(filePath)) || null;
  }

  /**
   * Parse configuration file
   */
  async parseFile(filePath: string): Promise<any> {
    const parser = this.getParser(filePath);
    if (!parser) {
      throw new ConfigError(
        `No parser found for file: ${filePath}`,
        'NO_PARSER',
        filePath
      );
    }

    const content = readFileSync(filePath, 'utf-8');
    return parser.parse(content, filePath);
  }

  /**
   * Get all supported extensions
   */
  getSupportedExtensions(): string[] {
    return this.parsers.flatMap(parser => parser.extensions);
  }
}

// Export default parser registry instance
export const defaultParserRegistry = new ParserRegistry();

// Convenience functions for direct parsing
export async function parseTypeScript(filePath: string): Promise<any> {
  const parser = new TypeScriptParser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}

export async function parseJavaScript(filePath: string): Promise<any> {
  const parser = new JavaScriptParser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}

export async function parseJSON(filePath: string): Promise<any> {
  const parser = new JsonParser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}

export async function parseJSON5(filePath: string): Promise<any> {
  const parser = new Json5Parser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}

export async function parseYAML(filePath: string): Promise<any> {
  const parser = new YamlParser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}

export async function parseEnv(filePath: string): Promise<any> {
  const parser = new EnvParser();
  const content = readFileSync(filePath, 'utf-8');
  return parser.parse(content, filePath);
}