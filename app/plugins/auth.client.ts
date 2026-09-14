export default defineNuxtPlugin(async () => {
  const auth = useCueAuth()
  await auth.initialize()
})
