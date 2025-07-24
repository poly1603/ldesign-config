import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigWatcher } from '../src/watcher';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), 'test-watcher');

describe('ConfigWatcher', () => {
  let watchers: ConfigWatcher[] = [];

  beforeEach(async () => {
    watchers = [];
    if (existsSync(TEST_DIR)) {
      try {
        rmSync(TEST_DIR, { recursive: true, force: true });
      } catch (error) {
        // 忽略权限错误，在 Windows 上可能发生
      }
    }
    mkdirSync(TEST_DIR, { recursive: true });
    // 等待文件系统操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    // 关闭所有监听器
    for (const watcher of watchers) {
      try {
        watcher.stop();
        watcher.close();
      } catch (error) {
        // 忽略关闭错误
      }
    }
    // 等待所有监听器关闭
    await new Promise(resolve => setTimeout(resolve, 200));
    if (existsSync(TEST_DIR)) {
      try {
        rmSync(TEST_DIR, { recursive: true, force: true });
      } catch (error) {
        // 忽略权限错误，在 Windows 上可能发生
      }
    }
  });

  describe('文件监听', () => {
    it('应该能够创建监听器实例', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      expect(watcher).toBeDefined();
    });

    it('应该能够开始和停止监听', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      const changeCallback = vi.fn();
      
      expect(() => {
        watcher.watch([join(TEST_DIR, 'test.config.json')], changeCallback);
      }).not.toThrow();
      
      expect(() => {
        watcher.stop();
      }).not.toThrow();
    });

    it('应该能够监听多个配置文件', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      const changeCallback = vi.fn();
      
      const configPath1 = join(TEST_DIR, 'app.config.json');
      const configPath2 = join(TEST_DIR, 'app.config.dev.json');
      
      expect(() => {
        watcher.watch([configPath1, configPath2], changeCallback);
      }).not.toThrow();
    });


  });

  describe('监听器管理', () => {
    it('应该能够停止监听', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      const changeCallback = vi.fn();
      
      watcher.watch([join(TEST_DIR, 'test.config.json')], changeCallback);
      
      expect(() => {
        watcher.stop();
      }).not.toThrow();
    });

    it('应该能够关闭监听器', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      
      expect(() => {
        watcher.close();
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该处理不存在的文件路径', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      const changeCallback = vi.fn();

      expect(() => {
        watcher.watch([join(TEST_DIR, 'nonexistent.config.json')], changeCallback);
      }).not.toThrow();
    });

    it('应该处理无效的文件路径', () => {
      const watcher = new ConfigWatcher();
      watchers.push(watcher);
      const changeCallback = vi.fn();

      expect(() => {
        watcher.watch([''], changeCallback);
      }).not.toThrow();
    });

    it('应该能够创建监听器而不出错', () => {
      expect(() => {
        const watcher = new ConfigWatcher();
        watchers.push(watcher);
      }).not.toThrow();
    });
  });
});