export default defineAppConfig({
  ui: {
    colors: {
      primary: "petrol",
      secondary: "salmon",
      success: "green",
      info: "blue",
      warning: "yellow",
      error: "red",
      neutral: "slate",
    },
    button: {
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class:
            "bg-(--ui-btn-default) hover:bg-(--ui-btn-hover) disabled:bg-(--ui-btn-disabled) disabled:opacity-100 aria-disabled:bg-(--ui-btn-disabled) aria-disabled:opacity-100",
        },
      ],
    },
  },
});
