export default defineNuxtPlugin({
  name: "stateConfigSync",
  dependsOn: ["pinia"],

  hooks: {
    "app:created"() {
      const { restore, listenToChange } = useRestoreState();
      void restore();

      // activate the watching of the state changes
      listenToChange();
    },
  },
});
