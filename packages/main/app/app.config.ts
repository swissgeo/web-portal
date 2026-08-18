export default defineAppConfig({
  ui: {
    colors: {
      primary: "petrol",
      secondary: "salmon",
      success: "green",
      info: "blue",
      warning: "yellow",
      error: "red",
      neutral: "neutral",
    },
    button: {
      slots: {
        base: "font-sans",
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class:
            "hover:bg-primary-600 disabled:hover:bg-primary aria-disabled:hover:bg-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        },
      ],
    },
    tabs: {
      slots: {
        trigger: "font-sans",
      },
    },
  },
});
