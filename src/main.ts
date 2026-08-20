import { createApp } from 'vue'
import '@fontsource-variable/noto-sans-sc/index.css'
import 'element-plus/dist/index.css'
import 'virtual:uno.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
