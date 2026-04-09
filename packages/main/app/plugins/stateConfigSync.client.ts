export default defineNuxtPlugin({
    name: 'stateConfigSync',
    dependsOn: ['pinia'],

    hooks: {
        async 'app:created'() {
            const { restore } = useSessionStorage()
            await restore()
        },
    },
})
