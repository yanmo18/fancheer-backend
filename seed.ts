import { prisma } from './src/lib/prisma'
import bcrypt from 'bcryptjs'
import { seedGraphData } from './graph-seed-data'
import { seedUploadFiles } from './seed-uploads'

const seedData = async () => {
  console.log('🌱 开始初始化数据库种子数据...')

  try {
    const uploadCount = seedUploadFiles()
    console.log(`📁 uploads 种子文件就绪: ${uploadCount} 个`)

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
        { url: '/uploads/avatars/avatar-01.jpg', sort_order: 10 },
        { url: '/uploads/avatars/avatar-02.jpg', sort_order: 9 },
        { url: '/uploads/avatars/avatar-03.jpg', sort_order: 8 },
        { url: '/uploads/avatars/avatar-04.jpg', sort_order: 7 },
        { url: '/uploads/avatars/avatar-05.jpg', sort_order: 6 },
        { url: '/uploads/avatars/avatar-06.jpg', sort_order: 5 },
        { url: '/uploads/avatars/avatar-07.jpg', sort_order: 4 },
        { url: '/uploads/avatars/avatar-08.jpg', sort_order: 3 },
      ]
    })
    console.log('✅ 头像创建成功: 8 个')

    console.log('🚩 创建Banner数据...')
    await prisma.banners.createMany({
      data: [
        { title: '欢迎来到 Fancheer 个人站', image_url: '/uploads/banners/banner1.jpg', link_url: '/', sort_order: 1, is_visible: true },
        { title: '博主形象展示', image_url: '/uploads/banners/banner2.jpg', link_url: '/', sort_order: 2, is_visible: true },
        { title: '音乐与日常', image_url: '/uploads/banners/banner3.jpg', link_url: '/', sort_order: 3, is_visible: true },
      ]
    })
    console.log('✅ Banner创建成功: 3 个')

    console.log('🏆 创建获奖记录数据...')
    await prisma.awards.createMany({
      data: [
        { title: '2026 年度创作成就', description: '个人创作作品获得年度展示推荐', image_url: '/uploads/awards/award1.jpg', award_date: new Date('2026-01-15'), sort_order: 1 },
        { title: '原创音乐入围奖', description: '原创单曲入选平台音乐精选集', image_url: '/uploads/awards/award2.jpg', award_date: new Date('2026-03-20'), sort_order: 2 },
        { title: '原创音乐奖', description: '原创单曲获得平台原创音乐奖', image_url: '/uploads/awards/award3.jpg', award_date: new Date('2026-05-10'), sort_order: 3 },
      ]
    })
    console.log('✅ 获奖记录创建成功: 3 个')

    console.log('🎵 创建音乐数据...')
    await prisma.songs.createMany({
      data: [
        { title: '星光闪耀', artist: 'Fancheer', audio_url: '/uploads/songs/song1.mp3', cover_url: '/uploads/songs/cover1.jpg', sort_order: 1 },
        { title: '梦想起飞', artist: 'Fancheer', audio_url: '/uploads/songs/song2.mp3', cover_url: '/uploads/songs/cover2.jpg', sort_order: 2 },
        { title: '夏日微风', artist: 'Fancheer', audio_url: '/uploads/songs/song3.mp3', cover_url: '/uploads/songs/cover3.jpg', sort_order: 3 },
      ]
    })
    console.log('✅ 音乐创建成功: 3 个')

    console.log('📅 创建活动数据...')
    await prisma.activities.createMany({
      data: [
        { title: '新年特别直播', description: '跨年直播与粉丝互动，回顾一年创作历程', cover_url: '/uploads/activities/activity-01.jpg', start_time: new Date('2026-01-01T20:00:00'), end_time: new Date('2026-01-01T23:00:00'), sort_order: 1 },
        { title: '春季创作企划', description: '以春天为主题的新作品连载与幕后分享', cover_url: '/uploads/activities/activity-02.jpg', start_time: new Date('2026-03-01'), end_time: new Date('2026-04-30'), sort_order: 2 },
        { title: '夏日创作企划', description: '分享夏日主题创作与作品更新', cover_url: '/uploads/activities/activity-03.jpg', start_time: new Date('2026-07-01'), end_time: new Date('2026-07-31'), sort_order: 3 },
        { title: '读者见面会', description: '与访客的线下交流见面活动', cover_url: '/uploads/activities/activity-04.jpg', start_time: new Date('2026-08-10'), end_time: new Date('2026-08-15'), sort_order: 4 },
        { title: '新曲试听会', description: '最新原创单曲抢先试听与创作谈', cover_url: '/uploads/activities/activity-05.jpg', start_time: new Date('2026-08-12'), end_time: new Date('2026-08-25'), sort_order: 5 },
        { title: '周年庆活动', description: '站点一周年庆典，限定内容与互动福利', cover_url: '/uploads/activities/activity-06.jpg', start_time: new Date('2026-09-01'), end_time: new Date('2026-09-30'), sort_order: 6 },
        { title: '秋季巡回直播', description: '连续四周主题直播，每周一个创作话题', cover_url: '/uploads/activities/activity-07.jpg', start_time: new Date('2026-10-01'), end_time: new Date('2026-10-28'), sort_order: 7 },
        { title: '年末感谢祭', description: '年度总结、粉丝感谢与来年计划发布', cover_url: '/uploads/activities/activity-08.jpg', start_time: new Date('2026-12-20'), end_time: new Date('2026-12-31'), sort_order: 8 },
      ]
    })
    console.log('✅ 活动创建成功: 8 个')

    console.log('🖼️ 创建图集数据...')
    await prisma.gallery_images.createMany({
      data: [
        { category: 'anime', url: '/uploads/gallery/anime-01.jpg', title: '形象 01', sort_order: 15 },
        { category: 'anime', url: '/uploads/gallery/anime-02.jpg', title: '形象 02', sort_order: 14 },
        { category: 'anime', url: '/uploads/gallery/anime-03.jpg', title: '形象 03', sort_order: 13 },
        { category: 'anime', url: '/uploads/gallery/anime-04.jpg', title: '形象 04', sort_order: 12 },
        { category: 'anime', url: '/uploads/gallery/anime-05.jpg', title: '形象 05', sort_order: 11 },
        { category: 'anime', url: '/uploads/gallery/anime-06.jpg', title: '形象 06', sort_order: 10 },
        { category: 'anime', url: '/uploads/gallery/anime-07.jpg', title: '形象 07', sort_order: 9 },
        { category: 'anime', url: '/uploads/gallery/anime-08.jpg', title: '形象 08', sort_order: 8 },
        { category: 'anime', url: '/uploads/gallery/anime-09.jpg', title: '形象 09', sort_order: 7 },
        { category: 'anime', url: '/uploads/gallery/anime-10.jpg', title: '形象 10', sort_order: 6 },
        { category: 'anime', url: '/uploads/gallery/anime-11.jpg', title: '形象 11', sort_order: 5 },
        { category: 'anime', url: '/uploads/gallery/anime-12.jpg', title: '形象 12', sort_order: 4 },
        { category: 'anime', url: '/uploads/gallery/anime-13.jpg', title: '形象 13', sort_order: 3 },
        { category: 'anime', url: '/uploads/gallery/anime-14.jpg', title: '形象 16', sort_order: 2 },
        { category: 'anime', url: '/uploads/gallery/anime-15.jpg', title: '形象 17', sort_order: 1 },
        { category: 'real', url: '/uploads/gallery/real-01.jpg', title: '日常随拍', sort_order: 6 },
        { category: 'real', url: '/uploads/gallery/real-02.jpg', title: '午后时光', sort_order: 5 },
        { category: 'real', url: '/uploads/gallery/real-03.jpg', title: '街拍记录', sort_order: 4 },
        { category: 'real', url: '/uploads/gallery/real-04.jpg', title: '舞台幕后', sort_order: 3 },
        { category: 'real', url: '/uploads/gallery/real-05.jpg', title: '旅行片段', sort_order: 2 },
        { category: 'real', url: '/uploads/gallery/real-06.jpg', title: '光影瞬间', sort_order: 1 },
      ]
    })
    console.log('✅ 图集创建成功: 21 个')

    console.log('📝 创建博主资料...')
    await prisma.streamer_info.create({
      data: { name: 'Fancheer', avatar_url: '/uploads/avatars/streamer.jpg', tags: '创作,音乐,分享', bio: '大家好，我是 Fancheer，在这里分享我的创作与生活。欢迎常来逛逛～' }
    })
    console.log('✅ 博主资料创建成功')

    console.log('🔗 创建关系图谱数据...')
    const graphSeed = await seedGraphData(prisma)
    console.log(`✅ 关系图谱创建成功: ${graphSeed.characterCount}个人物, ${graphSeed.relationCount}条关系`)

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
