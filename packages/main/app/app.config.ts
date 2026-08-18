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
    prose: {
      p: {
        base: "type-paragraph my-0 leading-normal",
      },
      strong: {
        base: "font-semibold",
      },
      li: {
        base: "type-paragraph leading-normal",
      },
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
        {
          color: "primary",
          variant: "ghost",
          class:
            "bg-transparent text-primary hover:bg-transparent hover:text-primary-600 active:bg-transparent active:text-primary disabled:bg-transparent disabled:text-primary-300 disabled:hover:bg-transparent aria-disabled:bg-transparent aria-disabled:text-primary-300 aria-disabled:hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-secondary",
        },
        {
          color: "primary",
          variant: "ghost",
          size: "md",
          class: "gap-2 px-2 py-1",
        },
        {
          color: "primary",
          variant: "ghost",
          size: "xl",
          class: {
            base: "gap-2 px-2 py-1 text-sm",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
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
