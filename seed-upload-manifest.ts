/**
 * uploads 种子文件清单：从前端 public/assets 复制到 backend/uploads
 * 与 seed.ts 中的 /uploads/ URL 保持一致
 */

export interface UploadCopySpec {
  src: string
  dest: string
  /** 额外复制一份（兼容旧库 .png 路径） */
  legacyDest?: string
}

export const FRONTEND_ASSETS_DIR = '../fancheer-frontend/public/assets'

/** Docker 等无法访问前端仓库时的本地素材目录 */
export const SEED_ASSETS_DIR = 'seed-assets'

export const UPLOAD_IMAGE_COPIES: UploadCopySpec[] = [
  // Banner
  { src: 'header.jpg', dest: 'banners/banner1.jpg', legacyDest: 'banners/banner1.png' },
  { src: 'picture-08.jpg', dest: 'banners/banner2.jpg', legacyDest: 'banners/banner2.png' },
  { src: 'picture-02.jpg', dest: 'banners/banner3.jpg', legacyDest: 'banners/banner3.png' },

  // 获奖
  { src: 'picture-11.jpg', dest: 'awards/award1.jpg', legacyDest: 'awards/award1.png' },
  { src: 'picture-09.jpg', dest: 'awards/award2.jpg', legacyDest: 'awards/award2.png' },
  { src: 'picture-16.jpg', dest: 'awards/award3.jpg', legacyDest: 'awards/award3.png' },

  // 音乐封面
  { src: 'picture-10.jpg', dest: 'songs/cover1.jpg', legacyDest: 'songs/cover1.png' },
  { src: 'picture-03.jpg', dest: 'songs/cover2.jpg', legacyDest: 'songs/cover2.png' },
  { src: 'picture-06.jpg', dest: 'songs/cover3.jpg', legacyDest: 'songs/cover3.png' },

  // 博主头像
  { src: 'picture-01.jpg', dest: 'avatars/streamer.jpg', legacyDest: 'avatars/streamer.png' },

  // 预设头像池
  { src: 'picture-01.jpg', dest: 'avatars/avatar-01.jpg' },
  { src: 'picture-08.jpg', dest: 'avatars/avatar-02.jpg' },
  { src: 'picture-16.jpg', dest: 'avatars/avatar-03.jpg' },
  { src: 'picture-02.jpg', dest: 'avatars/avatar-04.jpg' },
  { src: 'picture-03.jpg', dest: 'avatars/avatar-05.jpg' },
  { src: 'picture-10.jpg', dest: 'avatars/avatar-06.jpg' },
  { src: 'picture-11.jpg', dest: 'avatars/avatar-07.jpg' },
  { src: 'header.jpg', dest: 'avatars/avatar-08.jpg' },

  // 图集（二次元）
  { src: 'picture-01.jpg', dest: 'gallery/anime-01.jpg', legacyDest: 'gallery/anime1.png' },
  { src: 'picture-02.jpg', dest: 'gallery/anime-02.jpg', legacyDest: 'gallery/anime2.png' },
  { src: 'picture-03.jpg', dest: 'gallery/anime-03.jpg' },
  { src: 'picture-04.jpg', dest: 'gallery/anime-04.jpg' },
  { src: 'picture-05.jpg', dest: 'gallery/anime-05.jpg' },
  { src: 'picture-06.jpg', dest: 'gallery/anime-06.jpg' },
  { src: 'picture-07.jpg', dest: 'gallery/anime-07.jpg' },
  { src: 'picture-08.jpg', dest: 'gallery/anime-08.jpg' },
  { src: 'picture-09.jpg', dest: 'gallery/anime-09.jpg' },
  { src: 'picture-10.jpg', dest: 'gallery/anime-10.jpg' },
  { src: 'picture-11.jpg', dest: 'gallery/anime-11.jpg' },
  { src: 'picture-12.jpg', dest: 'gallery/anime-12.jpg' },
  { src: 'picture-13.jpg', dest: 'gallery/anime-13.jpg' },
  { src: 'picture-16.jpg', dest: 'gallery/anime-14.jpg' },
  { src: 'picture-17.jpg', dest: 'gallery/anime-15.jpg' },

  // 图集（三次元）
  { src: 'header.jpg', dest: 'gallery/real-01.jpg' },
  { src: 'picture-14.jpg', dest: 'gallery/real-02.jpg' },
  { src: 'picture-17.jpg', dest: 'gallery/real-03.jpg' },
  { src: 'picture-10.jpg', dest: 'gallery/real-04.jpg' },
  { src: 'picture-12.jpg', dest: 'gallery/real-05.jpg' },
  { src: 'picture-17.jpg', dest: 'gallery/real-06.jpg' },

  // 活动封面
  { src: 'picture-10.jpg', dest: 'activities/activity-01.jpg' },
  { src: 'picture-03.jpg', dest: 'activities/activity-02.jpg' },
  { src: 'picture-08.jpg', dest: 'activities/activity-03.jpg' },
  { src: 'picture-05.jpg', dest: 'activities/activity-04.jpg' },
  { src: 'picture-06.jpg', dest: 'activities/activity-05.jpg' },
  { src: 'header.jpg', dest: 'activities/activity-06.jpg' },
  { src: 'picture-11.jpg', dest: 'activities/activity-07.jpg' },
  { src: 'picture-16.jpg', dest: 'activities/activity-08.jpg' },

  // 关系图谱头像
  { src: 'picture-01.jpg', dest: 'graph/character-01.jpg' },
  { src: 'picture-16.jpg', dest: 'graph/character-02.jpg' },
  { src: 'header.jpg', dest: 'graph/character-03.jpg' },
  { src: 'picture-02.jpg', dest: 'graph/character-04.jpg' },
  { src: 'picture-08.jpg', dest: 'graph/character-05.jpg' },
  { src: 'picture-03.jpg', dest: 'graph/character-06.jpg' },
  { src: 'picture-05.jpg', dest: 'graph/character-07.jpg' },
  { src: 'picture-11.jpg', dest: 'graph/character-08.jpg' },
  { src: 'picture-06.jpg', dest: 'graph/character-09.jpg' },
  { src: 'picture-10.jpg', dest: 'graph/character-10.jpg' },
]

/** 占位音频（约 0.25 秒静音 MP3，仅供开发演示） */
export const UPLOAD_AUDIO_FILES = [
  'songs/song1.mp3',
  'songs/song2.mp3',
  'songs/song3.mp3',
] as const
