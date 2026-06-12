<script setup lang="ts">
import { useCounterStore } from '@/stores/account.ts'

const accountStore = useCounterStore()

function updateName() {
  accountStore.update({ name: 'wwj2' })
}
</script>

<template>
  <p>当前的值为:{{ accountStore.account.name }}</p>
  <a-button @click="updateName">update</a-button>
  <a-button @click="accountStore.clear">clear</a-button>
</template>

<style scoped></style>
