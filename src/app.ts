import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({ message: '粉丝官网 API 服务运行中' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`)
})
