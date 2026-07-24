import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import './config/redis'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    code: 200,
    msg: '后端服务启动成功',
    time: new Date()
  })
})

app.listen(PORT, () => {
  console.log(`🚀 服务运行地址：http://localhost:${PORT}`)
})

export default app
