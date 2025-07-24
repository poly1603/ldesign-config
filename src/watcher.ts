import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import type { WatchEventType, WatchCallback, ConfigFileInfo } from './types';
import { createDebugLogger } from './utils';

/**
 * Configuration file watcher
 */
export class ConfigWatcher extends EventEmitter {
  protected watcher: FSWatcher | null = null;
  protected watchedFiles = new Set<string>();
  protected debug: (message: string, ...args: any[]) => void;

  constructor(options: { debug?: boolean } = {}) {
    super();
    this.debug = createDebugLogger(options.debug || false, 'config-watcher');
  }

  /**
   * Start watching configuration files
   */
  watch(files: ConfigFileInfo[] | string[], callback?: WatchCallback): void {
    if (this.watcher) {
      this.stop();
    }

    const filePaths = Array.isArray(files) 
      ? files.map(file => typeof file === 'string' ? file : file.path)
      : [];
    this.debug('Starting to watch files:', filePaths);

    this.watcher = watch(filePaths, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      // disableGlobbing: true,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      alwaysStat: false,
      depth: 0,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    // Track watched files
    filePaths.forEach(path => this.watchedFiles.add(path));

    // Set up event listeners
    this.watcher.on('add', (path) => {
      this.debug('File added:', path);
      this.handleFileEvent('add', path, callback);
    });

    this.watcher.on('change', (path) => {
      this.debug('File changed:', path);
      this.handleFileEvent('change', path, callback);
    });

    this.watcher.on('unlink', (path) => {
      this.debug('File removed:', path);
      this.handleFileEvent('unlink', path, callback);
    });

    this.watcher.on('error', (error) => {
      this.debug('Watcher error:', error);
      this.emit('error', error);
    });

    this.watcher.on('ready', () => {
      this.debug('Watcher ready');
      this.emit('ready');
    });
  }

  /**
   * Add files to watch list
   */
  addFiles(files: ConfigFileInfo[] | string[]): void {
    if (!this.watcher) {
      throw new Error('Watcher not initialized. Call watch() first.');
    }

    const filePaths = files.map(file => typeof file === 'string' ? file : file.path);
    const newPaths = filePaths.filter(path => !this.watchedFiles.has(path));
    if (newPaths.length === 0) {
      return;
    }

    this.debug('Adding files to watch:', newPaths);

    this.watcher.add(newPaths);
    newPaths.forEach(path => this.watchedFiles.add(path));
  }

  /**
   * Remove files from watch list
   */
  removeFiles(filePaths: string[]): void {
    if (!this.watcher) {
      return;
    }

    const filesToRemove = filePaths.filter(path => this.watchedFiles.has(path));
    if (filesToRemove.length === 0) {
      return;
    }

    this.debug('Removing files from watch:', filesToRemove);

    this.watcher.unwatch(filesToRemove);
    filesToRemove.forEach(path => this.watchedFiles.delete(path));
  }

  /**
   * Stop watching files
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.watcher) {
        this.debug('Stopping watcher');
        this.watcher.close().then(() => {
          this.watcher = null;
          this.watchedFiles.clear();
          this.emit('stop');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if watcher is active
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }

  /**
   * Close the watcher (alias for stop)
   */
  close(): Promise<void> {
    return this.stop();
  }

  /**
   * Handle file system events
   */
  protected handleFileEvent(
    eventType: WatchEventType,
    filePath: string,
    callback?: WatchCallback
  ): void {
    this.emit('fileChange', eventType, filePath);
    
    if (callback) {
      try {
        callback(eventType, filePath);
      } catch (error) {
        this.debug('Error in watch callback:', error);
        this.emit('error', error);
      }
    }
  }
}

/**
 * Debounced configuration watcher
 * Useful for preventing multiple rapid reloads
 */
export class DebouncedConfigWatcher extends ConfigWatcher {
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pendingEvents = new Map<string, WatchEventType>();

  constructor(
    private debounceMs: number = 300,
    options: { debug?: boolean } = {}
  ) {
    super(options);
  }

  /**
   * Handle file system events with debouncing
   */
  protected handleFileEvent(
    eventType: WatchEventType,
    filePath: string,
    callback?: WatchCallback
  ): void {
    // Store the latest event for each file
    this.pendingEvents.set(filePath, eventType);

    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new timeout
    this.debounceTimeout = setTimeout(() => {
      // Process all pending events
      for (const [path, event] of this.pendingEvents.entries()) {
        super.handleFileEvent(event, path, callback);
      }
      
      // Clear pending events
      this.pendingEvents.clear();
      this.debounceTimeout = null;
    }, this.debounceMs);
  }

  /**
   * Stop watching and clear debounce timeout
   */
  stop(): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.pendingEvents.clear();
    return super.stop();
  }
}

/**
 * Smart configuration watcher that can detect new config files
 */
export class SmartConfigWatcher extends DebouncedConfigWatcher {
  private configDir: string;
  private configName: string;
  // private currentEnv?: string;

  constructor(
    configDir: string,
    configName: string,
    _currentEnv?: string,
    debounceMs = 300,
    options: { debug?: boolean } = {}
  ) {
    super(debounceMs, options);
    this.configDir = configDir;
    this.configName = configName;
    // this.currentEnv = currentEnv;
  }

  /**
   * Start smart watching that includes the config directory
   */
  smartWatch(files: ConfigFileInfo[], callback?: WatchCallback): void {
    // Watch existing config files
    this.watch(files, callback);

    // Also watch the config directory for new files
    if (this.watcher) {
      this.watcher.add(this.configDir);
    }
  }

  /**
   * Update environment and adjust watched files
   */
  updateEnvironment(_newEnv?: string): void {
    // this.currentEnv = newEnv;
    // The parent class will handle re-watching with new environment files
  }

  /**
   * Check if a file path is a relevant config file
   */
  private isRelevantConfigFile(filePath: string): boolean {
    const fileName = filePath.split(/[\\/]/).pop() || '';
    const configPattern = new RegExp(`^${this.configName}\.config(?:\.[^.]+)?\.[^.]+$`);
    return configPattern.test(fileName);
  }

  /**
   * Handle file events with smart detection
   */
  protected handleFileEvent(
    eventType: WatchEventType,
    filePath: string,
    callback?: WatchCallback
  ): void {
    // If it's a new config file in the directory, add it to watch list
    if (eventType === 'add' && this.isRelevantConfigFile(filePath)) {
      this.debug('Detected new config file:', filePath);
      if (this.watcher && !this.watchedFiles.has(filePath)) {
        this.watcher.add(filePath);
        this.watchedFiles.add(filePath);
      }
    }

    super.handleFileEvent(eventType, filePath, callback);
  }
}