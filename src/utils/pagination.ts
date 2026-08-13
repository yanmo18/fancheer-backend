import { PAGINATION } from '../config/constants'

/**
 * 解析分页参数，防止 pageSize 过大导致数据库压力
 */
export const parsePagination = (page: unknown, pageSize: unknown) => {
  const parsedPage = Number(page)
  const parsedPageSize = Number(pageSize)

  const safePage = Number.isFinite(parsedPage) && parsedPage >= 1
    ? Math.floor(parsedPage)
    : PAGINATION.DEFAULT_PAGE

  const safePageSize = Number.isFinite(parsedPageSize) && parsedPageSize >= 1
    ? Math.min(Math.floor(parsedPageSize), PAGINATION.MAX_PAGE_SIZE)
    : PAGINATION.DEFAULT_PAGE_SIZE

  return { page: safePage, pageSize: safePageSize }
}
