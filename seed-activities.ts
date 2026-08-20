import { prisma } from './src/lib/prisma'
import { seedUploadFiles } from './seed-uploads'

/** 仅刷新活动日历数据，不影响用户与其他内容 */
async function seedActivities() {
  console.log('📅 写入活动日历数据...')

  seedUploadFiles()

  await prisma.activities.deleteMany()

  const { count } = await prisma.activities.createMany({
    data: [
      {
        title: '新年特别直播',
        description: '跨年直播与粉丝互动，回顾一年创作历程',
        cover_url: '/uploads/activities/activity-01.jpg',
        start_time: new Date('2026-01-01T20:00:00'),
        end_time: new Date('2026-01-01T23:00:00'),
        sort_order: 1,
      },
      {
        title: '春季创作企划',
        description: '以春天为主题的新作品连载与幕后分享',
        cover_url: '/uploads/activities/activity-02.jpg',
        start_time: new Date('2026-03-01'),
        end_time: new Date('2026-04-30'),
        sort_order: 2,
      },
      {
        title: '夏日创作企划',
        description: '分享夏日主题创作与作品更新',
        cover_url: '/uploads/activities/activity-03.jpg',
        start_time: new Date('2026-07-01'),
        end_time: new Date('2026-07-31'),
        sort_order: 3,
      },
      {
        title: '读者见面会',
        description: '与访客的线下交流见面活动',
        cover_url: '/uploads/activities/activity-04.jpg',
        start_time: new Date('2026-08-10'),
        end_time: new Date('2026-08-15'),
        sort_order: 4,
      },
      {
        title: '新曲试听会',
        description: '最新原创单曲抢先试听与创作谈',
        cover_url: '/uploads/activities/activity-05.jpg',
        start_time: new Date('2026-08-12'),
        end_time: new Date('2026-08-25'),
        sort_order: 5,
      },
      {
        title: '周年庆活动',
        description: '站点一周年庆典，限定内容与互动福利',
        cover_url: '/uploads/activities/activity-06.jpg',
        start_time: new Date('2026-09-01'),
        end_time: new Date('2026-09-30'),
        sort_order: 6,
      },
      {
        title: '秋季巡回直播',
        description: '连续四周主题直播，每周一个创作话题',
        cover_url: '/uploads/activities/activity-07.jpg',
        start_time: new Date('2026-10-01'),
        end_time: new Date('2026-10-28'),
        sort_order: 7,
      },
      {
        title: '年末感谢祭',
        description: '年度总结、粉丝感谢与来年计划发布',
        cover_url: '/uploads/activities/activity-08.jpg',
        start_time: new Date('2026-12-20'),
        end_time: new Date('2026-12-31'),
        sort_order: 8,
      },
    ],
  })

  console.log(`✅ 已写入 ${count} 条活动`)
  await prisma.$disconnect()
}

seedActivities().catch(async (error) => {
  console.error('❌ 活动写入失败:', error)
  await prisma.$disconnect()
  process.exit(1)
})
