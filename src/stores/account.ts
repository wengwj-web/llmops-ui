import { defineStore } from 'pinia'
import { ref } from 'vue'

const initAccount = {
  name: 'wwj',
  email: '123@qq.com',
  avatar: '',
}

export const useCounterStore = defineStore('account', () => {
  const account = ref({ ...initAccount })

  function update(params: any) {
    Object.assign(account.value, params)
  }

  function clear() {
    account.value = { ...initAccount }
  }

  return { account, update, clear }
})
