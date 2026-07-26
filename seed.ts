import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/prisma/client'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const dbUrl = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
})

const prisma = new PrismaClient({ adapter })

const seedData = async () => {
  console.log('🌱 开始初始化数据库种子数据...')

  try {
    console.log('🗑️ 清空现有数据...')
    await prisma.$transaction([
      prisma.messages.deleteMany(),
      prisma.likes.deleteMany(),
      prisma.reports.deleteMany(),
      prisma.private_replies.deleteMany(),
      prisma.admin_logs.deleteMany(),
      prisma.check_ins.deleteMany(),
      prisma.graph_relations.deleteMany(),
      prisma.graph_characters.deleteMany(),
      prisma.gallery_images.deleteMany(),
      prisma.activities.deleteMany(),
      prisma.songs.deleteMany(),
      prisma.awards.deleteMany(),
      prisma.banners.deleteMany(),
      prisma.streamer_info.deleteMany(),
      prisma.sensitive_words.deleteMany(),
      prisma.users.deleteMany(),
      prisma.avatars.deleteMany(),
    ])
    console.log('✅ 数据清空完成')

    const hashedPassword = await bcrypt.hash('123456', 10)

    console.log('👤 创建管理员用户...')
    const admin = await prisma.users.create({
      data: {
        username: 'admin',
        password_hash: hashedPassword,
        nickname: '管理员',
        role: 'admin',
        status: 'active'
      }
    })
    console.log(`✅ 管理员创建成功: id=${admin.id}, username=admin`)

    console.log('🎤 创建主播用户...')
    const streamer = await prisma.users.create({
      data: {
        username: 'streamer',
        password_hash: hashedPassword,
        nickname: 'Fancheer',
        role: 'streamer',
        status: 'active'
      }
    })
    console.log(`✅ 主播创建成功: id=${streamer.id}, username=streamer`)

    console.log('👥 创建粉丝用户...')
    const fan = await prisma.users.create({
      data: {
        username: 'fan001',
        password_hash: hashedPassword,
        nickname: '忠实粉丝',
        role: 'fan',
        status: 'active'
      }
    })
    console.log(`✅ 粉丝创建成功: id=${fan.id}, username=fan001`)

    console.log('�️ 创建头像数据...')
    const avatar1 = await prisma.avatars.create({
      data: { url: '/uploads/avatars/default1.png', sort_order: 1 }
    })
    const avatar2 = await prisma.avatars.create({
      data: { url: '/uploads/avatars/default2.png', sort_order: 2 }
    })
    const avatar3 = await prisma.avatars.create({
      data: { url: '/uploads/avatars/default3.png', sort_order: 3 }
    })
    console.log(`✅ 头像创建成功: 3 个`)

    console.log('🚩 创建Banner数据...')
    await prisma.banners.create({
      data: { title: '欢迎来到Fancheer粉丝官网', image_url: '/uploads/banners/banner1.png', link_url: '/', sort_order: 1, is_visible: true }
    })
    await prisma.banners.create({
      data: { title: '最新单曲发布', image_url: '/uploads/banners/banner2.png', link_url: '/songs', sort_order: 2, is_visible: true }
    })
    await prisma.banners.create({
      data: { title: '夏日活动来袭', image_url: '/uploads/banners/banner3.png', link_url: '/activities', sort_order: 3, is_visible: true }
    })
    console.log(`✅ Banner创建成功: 3 个`)

    console.log('🏆 创建获奖记录数据...')
    await prisma.awards.create({
      data: { title: '2026年度最佳虚拟主播', description: '荣获平台颁发的年度最佳虚拟主播奖项', image_url: '/uploads/awards/award1.png', award_date: new Date('2026-01-15'), sort_order: 1 }
    })
    await prisma.awards.create({
      data: { title: '人气主播TOP10', description: '连续三个月进入人气榜单前十', image_url: '/uploads/awards/award2.png', award_date: new Date('2026-03-20'), sort_order: 2 }
    })
    await prisma.awards.create({
      data: { title: '原创音乐奖', description: '原创单曲获得平台原创音乐奖', image_url: '/uploads/awards/award3.png', award_date: new Date('2026-05-10'), sort_order: 3 }
    })
    console.log(`✅ 获奖记录创建成功: 3 个`)

    console.log('🎵 创建音乐数据...')
    await prisma.songs.create({
      data: { title: '星光闪耀', artist: 'Fancheer', audio_url: '/uploads/songs/song1.mp3', cover_url: '/uploads/songs/cover1.png', sort_order: 1 }
    })
    await prisma.songs.create({
      data: { title: '梦想起飞', artist: 'Fancheer', audio_url: '/uploads/songs/song2.mp3', cover_url: '/uploads/songs/cover2.png', sort_order: 2 }
    })
    await prisma.songs.create({
      data: { title: '夏日微风', artist: 'Fancheer', audio_url: '/uploads/songs/song3.mp3', cover_url: '/uploads/songs/cover3.png', sort_order: 3 }
    })
    console.log(`✅ 音乐创建成功: 3 个`)

    console.log('📅 创建活动数据...')
    await prisma.activities.create({
      data: { title: '夏日特别直播', description: '夏日限定直播活动，与粉丝互动', cover_url: '/uploads/activities/activity1.png', start_time: new Date('2026-07-20'), end_time: new Date('2026-07-31'), sort_order: 1 }
    })
    await prisma.activities.create({
      data: { title: '粉丝见面会', description: '线下粉丝见面会活动', cover_url: '/uploads/activities/activity2.png', start_time: new Date('2026-08-15'), end_time: new Date('2026-08-15'), sort_order: 2 }
    })
    await prisma.activities.create({
      data: { title: '周年庆活动', description: '一周年庆典活动', cover_url: '/uploads/activities/activity3.png', start_time: new Date('2026-09-01'), end_time: new Date('2026-09-30'), sort_order: 3 }
    })
    console.log(`✅ 活动创建成功: 3 个`)

    console.log('🖼️ 创建图集数据...')
    await prisma.gallery_images.create({
      data: { category: 'anime', url: '/uploads/gallery/anime1.png', title: '二次元插画1', sort_order: 1 }
    })
    await prisma.gallery_images.create({
      data: { category: 'anime', url: '/uploads/gallery/anime2.png', title: '二次元插画2', sort_order: 2 }
    })
    await prisma.gallery_images.create({
      data: { category: 'real', url: '/uploads/gallery/real1.png', title: '三次元照片1', sort_order: 1 }
    })
    await prisma.gallery_images.create({
      data: { category: 'real', url: '/uploads/gallery/real2.png', title: '三次元照片2', sort_order: 2 }
    })
    console.log(`✅ 图集创建成功: 4 个`)

    console.log('📝 创建主播资料...')
    await prisma.streamer_info.create({
      data: { name: 'Fancheer', avatar_url: '/uploads/avatars/streamer.png', tags: '虚拟主播,唱歌,游戏', bio: '大家好，我是Fancheer，一个热爱唱歌和游戏的虚拟主播！感谢大家的支持~' }
    })
    console.log(`✅ 主播资料创建成功`)

    console.log('🔗 创建关系图谱数据...')
    const char1 = await prisma.graph_characters.create({
      data: { name: 'Fancheer', avatar_url: '/uploads/graph/fancheer.png', bio: '虚拟主播', is_center: true, sort_order: 1 }
    })
    const char2 = await prisma.graph_characters.create({
      data: { name: '小伙伴A', avatar_url: '/uploads/graph/friend1.png', bio: '好友', is_center: false, sort_order: 2 }
    })
    const char3 = await prisma.graph_characters.create({
      data: { name: '小伙伴B', avatar_url: '/uploads/graph/friend2.png', bio: '好友', is_center: false, sort_order: 3 }
    })
    await prisma.graph_relations.create({
      data: { from_character_id: char1.id, to_character_id: char2.id, relation_label: '好友', sort_order: 1 }
    })
    await prisma.graph_relations.create({
      data: { from_character_id: char1.id, to_character_id: char3.id, relation_label: '好友', sort_order: 2 }
    })
    console.log(`✅ 关系图谱创建成功: 3个人物, 2条关系`)

    console.log('�� 创建敏感词...')
    const sensitiveWords = ['色情', '暴力', '赌博', '毒品', '诈骗', '广告']
    for (const word of sensitiveWords) {
      await prisma.sensitive_words.create({
        data: { word }
      })
    }
    console.log(`✅ 敏感词创建成功: ${sensitiveWords.length} 个`)

    console.log('💬 创建聊天消息数据...')
    await prisma.messages.create({
      data: { sender_id: fan.id, content: '主播今天好可爱！', type: 'public', like_count: 10 }
    })
    await prisma.messages.create({
      data: { sender_id: fan.id, content: '什么时候直播呀？', type: 'public', like_count: 5 }
    })
    await prisma.messages.create({
      data: { sender_id: fan.id, content: '主播你好，想对你说一些心里话...', type: 'private', like_count: 0 }
    })
    await prisma.messages.create({
      data: { sender_id: streamer.id, content: '谢谢大家的支持！', type: 'public', like_count: 20 }
    })
    console.log(`✅ 聊天消息创建成功: 4 条`)

    console.log('🎉 数据库种子数据初始化完成！')
    console.log('')
    console.log('登录账号信息：')
    console.log('  - 管理员: username=admin, password=123456')
    console.log('  - 主播: username=streamer, password=123456')
    console.log('  - 粉丝: username=fan001, password=123456')
    console.log('')
    console.log('数据统计：')
    console.log('  - 用户: 3 个')
    console.log('  - 头像: 3 个')
    console.log('  - Banner: 3 个')
    console.log('  - 获奖记录: 3 个')
    console.log('  - 音乐: 3 个')
    console.log('  - 活动: 3 个')
    console.log('  - 图集: 4 个')
    console.log('  - 主播资料: 1 个')
    console.log('  - 关系图谱: 3个人物, 2条关系')
    console.log('  - 敏感词: 6 个')
    console.log('  - 聊天消息: 4 条')

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ 初始化种子数据失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seedData()