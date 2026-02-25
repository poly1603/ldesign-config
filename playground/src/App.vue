<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ConfigManager } from '@ldesign/config-core'
import { useConfig } from '@ldesign/config-vue'

const manager = new ConfigManager({
  initial: {
    app: { title: 'LDesign Demo', version: '1.0.0', debug: false },
    api: { baseUrl: 'https://api.example.com', timeout: 5000 },
    ui: { theme: 'light', language: 'zh-CN' },
  },
})

// 手动注入（playground 中无 plugin）
import { provide } from 'vue'
provide('ldesign-config', manager)

const configSnapshot = ref(JSON.stringify(manager.getAll(), null, 2))
const editKey = ref('app.title')
const editValue = ref('')

manager.onChange(() => {
  configSnapshot.value = JSON.stringify(manager.getAll(), null, 2)
})

function updateConfig() {
  let val: any = editValue.value
  try { val = JSON.parse(val) } catch {}
  manager.set(editKey.value, val)
  editValue.value = ''
}
</script>

<template>
  <div style="max-width: 600px; margin: 40px auto; font-family: sans-serif;">
    <h1>@ldesign/config Playground</h1>

    <section style="margin-bottom: 24px;">
      <h2>修改配置</h2>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input v-model="editKey" placeholder="键名 (如 app.title)" style="flex:1;padding:8px;" />
        <input v-model="editValue" placeholder="新值" style="flex:1;padding:8px;" />
        <button @click="updateConfig" style="padding:8px 16px;">设置</button>
      </div>
      <button @click="manager.reset()" style="padding:4px 12px;">重置</button>
    </section>

    <section>
      <h2>当前配置</h2>
      <pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;">{{ configSnapshot }}</pre>
    </section>
  </div>
</template>
