export default defineNuxtPlugin({
    name: 'stateConfigSync',
    dependsOn: ['pinia'],

    hooks: {
        'app:created'() {
            const { restore } = useRestoreState()            
            void restore()
        },
    },
})