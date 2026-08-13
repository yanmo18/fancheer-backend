import { prisma } from './src/lib/prisma'
import bcrypt from 'bcryptjs'

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

    console.log('👤 创建博主（站主）用户...')
    const streamer = await prisma.users.create({
      data: {
        username: 'streamer',
        password_hash: hashedPassword,
        nickname: 'Fancheer',
        role: 'streamer',
        status: 'active'
      }
    })
    console.log(`✅ 博主创建成功: id=${streamer.id}, username=streamer`)

    console.log('👥 创建注册访客...')
    const fan = await prisma.users.create({
      data: {
        username: 'fan001',
        password_hash: hashedPassword,
        nickname: '访客小明',
        role: 'fan',
        status: 'active'
      }
    })
    console.log(`✅ 访客创建成功: id=${fan.id}, username=fan001`)

    console.log('🖼️ 创建头像数据...')
    await prisma.avatars.createMany({
      data: [
        { url: '/uploads/avatars/default1.png', sort_order: 1 },
        { url: '/uploads/avatars/default2.png', sort_order: 2 },
        { url: '/uploads/avatars/default3.png', sort_order: 3 },
      ]
    })
    console.log('✅ 头像创建成功: 3 个')

    console.log('🚩 创建Banner数据...')
    await prisma.banners.createMany({
      data: [
        { title: '欢迎来到 Fancheer 个人站', image_url: '/uploads/banners/banner1.png', link_url: '/', sort_order: 1, is_visible: true },
        { title: '最新单曲发布', image_url: '/uploads/banners/banner2.png', link_url: '/songs', sort_order: 2, is_visible: true },
        { title: '夏日活动来袭', image_url: '/uploads/banners/banner3.png', link_url: '/activities', sort_order: 3, is_visible: true },
      ]
    })
    console.log('✅ Banner创建成功: 3 个')

    console.log('🏆 创建获奖记录数据...')
    await prisma.awards.createMany({
      data: [
        { title: '2026 年度创作成就', description: '个人创作作品获得年度展示推荐', image_url: '/uploads/awards/award1.png', award_date: new Date('2026-01-15'), sort_order: 1 },
        { title: '原创音乐入围奖', description: '原创单曲入选平台音乐精选集', image_url: '/uploads/awards/award2.png', award_date: new Date('2026-03-20'), sort_order: 2 },
        { title: '原创音乐奖', description: '原创单曲获得平台原创音乐奖', image_url: '/uploads/awards/award3.png', award_date: new Date('2026-05-10'), sort_order: 3 },
      ]
    })
    console.log('✅ 获奖记录创建成功: 3 个')

    console.log('🎵 创建音乐数据...')
    await prisma.songs.createMany({
      data: [
        { title: '星光闪耀', artist: 'Fancheer', audio_url: '/uploads/songs/song1.mp3', cover_url: '/uploads/songs/cover1.png', sort_order: 1 },
        { title: '梦想起飞', artist: 'Fancheer', audio_url: '/uploads/songs/song2.mp3', cover_url: '/uploads/songs/cover2.png', sort_order: 2 },
        { title: '夏日微风', artist: 'Fancheer', audio_url: '/uploads/songs/song3.mp3', cover_url: '/uploads/songs/cover3.png', sort_order: 3 },
      ]
    })
    console.log('✅ 音乐创建成功: 3 个')

    console.log('📅 创建活动数据...')
    await prisma.activities.createMany({
      data: [
        { title: '夏日创作企划', description: '分享夏日主题创作与作品更新', cover_url: '/uploads/activities/activity1.png', start_time: new Date('2026-07-20'), end_time: new Date('2026-07-31'), sort_order: 1 },
        { title: '读者见面会', description: '与访客的线下交流见面活动', cover_url: '/uploads/activities/activity2.png', start_time: new Date('2026-08-15'), end_time: new Date('2026-08-15'), sort_order: 2 },
        { title: '周年庆活动', description: '一周年庆典活动', cover_url: '/uploads/activities/activity3.png', start_time: new Date('2026-09-01'), end_time: new Date('2026-09-30'), sort_order: 3 },
      ]
    })
    console.log('✅ 活动创建成功: 3 个')

    console.log('🖼️ 创建图集数据...')
    await prisma.gallery_images.createMany({
      data: [
        { category: 'anime', url: '/uploads/gallery/anime1.png', title: '二次元插画1', sort_order: 1 },
        { category: 'anime', url: '/uploads/gallery/anime2.png', title: '二次元插画2', sort_order: 2 },
        { category: 'real', url: '/uploads/gallery/real1.png', title: '三次元照片1', sort_order: 1 },
        { category: 'real', url: '/uploads/gallery/real2.png', title: '三次元照片2', sort_order: 2 },
      ]
    })
    console.log('✅ 图集创建成功: 4 个')

    console.log('📝 创建博主资料...')
    await prisma.streamer_info.create({
      data: { name: 'Fancheer', avatar_url: '/uploads/avatars/streamer.png', tags: '创作,音乐,分享', bio: '大家好，我是 Fancheer，在这里分享我的创作与生活。欢迎常来逛逛～' }
    })
    console.log('✅ 博主资料创建成功')

    console.log('🔗 创建关系图谱数据...')
    const char1 = await prisma.graph_characters.create({
      data: { name: 'Fancheer', avatar_url: '/uploads/graph/fancheer.png', bio: '博主', is_center: true, sort_order: 1 }
    })
    const char2 = await prisma.graph_characters.create({
      data: { name: '小伙伴A', avatar_url: '/uploads/graph/friend1.png', bio: '好友', is_center: false, sort_order: 2 }
    })
    const char3 = await prisma.graph_characters.create({
      data: { name: '小伙伴B', avatar_url: '/uploads/graph/friend2.png', bio: '好友', is_center: false, sort_order: 3 }
    })
    await prisma.graph_relations.createMany({
      data: [
        { from_character_id: char1.id, to_character_id: char2.id, relation_label: '好友', sort_order: 1 },
        { from_character_id: char1.id, to_character_id: char3.id, relation_label: '好友', sort_order: 2 },
      ]
    })
    console.log('✅ 关系图谱创建成功: 3个人物, 2条关系')

    console.log('🔒 创建敏感词...')
    const sensitiveWords = ['色情', '暴力', '赌博', '毒品', '诈骗', '广告']
    await prisma.sensitive_words.createMany({
      data: sensitiveWords.map(word => ({ word }))
    })
    console.log(`✅ 敏感词创建成功: ${sensitiveWords.length} 个`)

    console.log('💬 创建聊天消息数据...')
    await prisma.messages.createMany({
      data: [
        { sender_id: fan.id, content: '今天更新的作品好棒！', type: 'public', like_count: 10 },
        { sender_id: fan.id, content: '期待下一期内容～', type: 'public', like_count: 5 },
        { sender_id: fan.id, content: '博主你好，想对你说一些心里话...', type: 'private', like_count: 0 },
        { sender_id: streamer.id, content: '谢谢大家的支持！', type: 'public', like_count: 20 },
      ]
    })
    console.log('✅ 聊天消息创建成功: 4 条')

    console.log('🎉 数据库种子数据初始化完成！')
    console.log('')
    console.log('登录账号（密码均为 123456）：')
    console.log('  - 协管员: admin')
    console.log('  - 博主/站主: streamer')
    console.log('  - 注册访客: fan001')

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ 初始化种子数据失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seedData()
