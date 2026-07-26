import xss from 'xss'

export const sanitize = (str: string | undefined): string => {
  if (!str) return ''
  return xss(str)
}

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = { ...obj }
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'string') {
      result[key] = sanitize(result[key])
    }
  })
  return result as T
}