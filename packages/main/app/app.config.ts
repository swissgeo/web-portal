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
    blogPost: {
      slots: {
        root: "h-full rounded-lg bg-default font-sans ring ring-default",
        body: "p-6",
        image: "object-cover object-center",
        title: "text-xl font-bold leading-7 text-highlighted",
        description: "mt-1 text-base leading-6 text-muted",
        meta: "mb-0 pb-0.5",
        badge: "bg-transparent p-0 text-sm font-semibold text-highlighted",
      },
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
        base: "font-interface",
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class:
            "hover:bg-primary-600 disabled:hover:bg-primary aria-disabled:hover:bg-primary focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
        },
        {
          color: "primary",
          variant: "outline",
          class:
            "bg-transparent text-primary ring-primary hover:bg-transparent hover:text-primary-600 hover:ring-primary-600 active:bg-transparent disabled:bg-transparent disabled:text-primary-300 disabled:ring-primary-300 disabled:hover:bg-transparent aria-disabled:bg-transparent aria-disabled:text-primary-300 aria-disabled:ring-primary-300 aria-disabled:hover:bg-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
        },
        {
          color: "primary",
          variant: "ghost",
          class:
            "bg-transparent text-primary hover:bg-transparent hover:text-primary-600 active:bg-transparent active:text-primary disabled:bg-transparent disabled:text-primary-300 disabled:hover:bg-transparent aria-disabled:bg-transparent aria-disabled:text-primary-300 aria-disabled:hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
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
