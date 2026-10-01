/**
 * 修复因时区写入导致「今天打卡落成昨天 DATE」的记录。
 * 规则：created_at 的上海日历日 与 check_date(UTC日) 差 1 天时，把 check_date 改成创建日。
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { prisma } from '../src/lib/prisma'

dayjs.extend(utc)
dayjs.extend(timezone)

async function main() {
  const rows = await prisma.check_ins.findMany({
    select: { id: true, check_date: true, created_at: true, user_id: true },
  })
  let fixed = 0
  for (const row of rows) {
    const stored = dayjs.utc(row.check_date).format('YYYY-MM-DD')
    const created = dayjs(row.created_at).tz('Asia/Shanghai').format('YYYY-MM-DD')
    if (stored === created) continue
    const expectedPrev = dayjs.utc(created).subtract(1, 'day').format('YYYY-MM-DD')
    if (stored !== expectedPrev) continue

    const nextDate = dayjs.utc(created).startOf('day').toDate()
    // 若同用户已有正确日期记录则删掉错误行，避免唯一约束冲突
    const clash = await prisma.check_ins.findFirst({
      where: { user_id: row.user_id, check_date: nextDate, NOT: { id: row.id } },
    })
    if (clash) {
      await prisma.check_ins.delete({ where: { id: row.id } })
      console.log(`deleted duplicate id=${row.id} kept id=${clash.id} date=${created}`)
    } else {
      await prisma.check_ins.update({
        where: { id: row.id },
        data: { check_date: nextDate },
      })
      console.log(`fixed id=${row.id} ${stored} -> ${created}`)
    }
    fixed += 1
  }
  console.log(`done fixed=${fixed}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
