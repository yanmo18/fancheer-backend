/**
 * 自定义业务错误类
 * 
 * 作用：区分业务主动错误和系统代码BUG错误
 *       支持自定义 HTTP 状态码：400参数错误、401未登录、403无权限、500服务异常
 *       配合全局异常中间件，自动格式化统一错误返回
 * 
 * 使用方式：
 *   throw new AppError('用户名已存在', 409)
 *   throw new AppError('未登录', 401)
 */

class AppError extends Error {
  public code: number

  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export default AppError