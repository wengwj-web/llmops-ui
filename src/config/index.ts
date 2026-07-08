export const apiPrefix: string = 'http://localhost:5000'
// export const apiPrefix: string = 'http://localhost:5173/api'

export const httpCode = {
  success: 'Success',
  fail: 'Fail',
  notFound: 'NotFound',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  validateError: 'ValidateError',
}

// 类型字符串与中文映射
export const typeMap: { [key: string]: string } = {
  str: '字符串',
  int: '整型',
  float: '浮点型',
  bool: '布尔值',
}
