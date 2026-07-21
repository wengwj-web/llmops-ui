import { apiPrefix, httpCode } from '@/config'
import { Message } from '@arco-design/web-vue'

const TIME_OUT = 100000

const baseFetchOptions = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  redirect: 'follow',
}

type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, any>
  body?: BodyInit | Record<string, any> | null
}

const baseFetch = <T>(url: string, fetchOptions: FetchOptionType): Promise<T> => {
  const options: typeof baseFetchOptions & FetchOptionType = Object.assign(
    {},
    baseFetchOptions,
    fetchOptions,
  )
  let urlWithPrefix: string = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  const { method, params, body } = options

  if (method === 'GET' && params) {
    const paramsArray: string[] = []
    Object.keys(params).forEach((key) => {
      paramsArray.push(`${key}=${encodeURIComponent(params[key])}`)
    })
    if (urlWithPrefix.search(/\?/) === -1) {
      urlWithPrefix += `?${paramsArray.join('&')}`
    } else {
      urlWithPrefix += `&${paramsArray.join('&')}`
    }

    delete options.params
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  return Promise.race([
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('接口已超时')
      }, TIME_OUT)
    }),
    new Promise((resolve, reject) => {
      globalThis
        .fetch(urlWithPrefix, options as RequestInit)
        .then(async (res) => {
          const json = await res.json()
          console.log(json)
          if (json.code === httpCode.success) {
            resolve(json)
          } else {
            Message.error(json.message)
            reject(new Error(json.message))
          }
        })
        .catch((err: any) => {
          Message.error(err.message)
          reject(err)
        })
    }),
  ]) as Promise<T>
}

// 5.封装基于post的sse(流式事件响应)请求
export const ssePost = async (
  url: string,
  fetchOptions: FetchOptionType,
  onData: (data: { [key: string]: any }) => void,
) => {
  // 5.1 组装基础的fetch请求配置
  const options = Object.assign({}, baseFetchOptions, { method: 'POST' }, fetchOptions)

  // 5.2 组装请求URL
  const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

  // 5.3 结构body参数，并处理body对应的数据
  const { body } = fetchOptions
  if (body) options.body = JSON.stringify(body)

  // 5.4 发起fetch请求并处理流式事件响应
  const response = await globalThis.fetch(urlWithPrefix, options as RequestInit)
  return handleStream(response, onData)
}

const handleStream = (response: Response, onData: (data: { [key: string]: any }) => void) => {
  // 1.检测网络请求是否正常
  if (!response.ok) throw new Error('网络请求失败')

  // 2.构建reader以及deocder
  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 3.构建read函数用于去读取数据
  const read = () => {
    let hasError = false
    reader?.read().then((result: any) => {
      if (result.done) return

      buffer += decoder.decode(result.value, { stream: true })
      const lines = buffer.split('\n')

      let event = ''
      let data = ''

      try {
        lines.forEach((line) => {
          line = line.trim()
          if (line.startsWith('event:')) {
            event = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            data = line.slice(5).trim()
          }

          // 每个事件以空行结束，只有event和data同时存在，才表示一次流式事件的数据完整获取到了
          if (line === '') {
            if (event !== '' && data !== '') {
              onData({
                event: event,
                data: JSON.parse(data),
              })
              event = ''
              data = ''
            }
          }
        })
        buffer = lines.pop() || ''
      } catch (e) {
        hasError = true
      }

      if (!hasError) read()
    })
  }

  // 4.调用read函数去执行获取对应的数据
  read()
}

export const request = <T>(url: string, options = {}) => {
  return baseFetch<T>(url, options)
}

export const get = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'GET' }))
}

export const post = <T>(url: string, options = {}) => {
  return request<T>(url, Object.assign({}, options, { method: 'POST' }))
}
