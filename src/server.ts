/**
 * HTTP 服务启动入口（开发 / 生产）
 */
import app from './app'
import { loadSensitiveWords } from './utils/sensitiveWord'

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, async () => {
  try {
    await loadSensitiveWords()
    console.log(`🚀 服务运行在 http://localhost:${PORT}`)
  } catch (err) {
    console.error('❌ 敏感词加载失败，过滤功能不可用:', err)
    process.exit(1)
  }
})
