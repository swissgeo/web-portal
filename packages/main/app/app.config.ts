export default defineAppConfig({
  ui: {
    colors: {
      primary: "petrol",
      secondary: "salmon",
      accent: "slate",
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
            "bg-transparent text-primary ring-primary hover:bg-transparent hover:text-primary-600 hover:ring-primary-600 disabled:bg-transparent disabled:text-primary-300 disabled:ring-primary-300 disabled:hover:bg-transparent aria-disabled:bg-transparent aria-disabled:text-primary-300 aria-disabled:ring-primary-300 aria-disabled:hover:bg-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
        },
        {
          color: "primary",
          variant: "ghost",
          class:
            "bg-transparent text-primary hover:bg-transparent hover:text-primary-600 disabled:bg-transparent disabled:text-primary-300 disabled:hover:bg-transparent aria-disabled:bg-transparent aria-disabled:text-primary-300 aria-disabled:hover:bg-transparent focus-visible:bg-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
        },
        {
          color: "primary",
          size: "md",
          class: "gap-space-xs px-space-xs py-space-2xs leading-[1.3]",
        },
        {
          color: "primary",
          size: "xs",
          class: "leading-[1.3]",
        },
        {
          color: "accent",
          variant: "ghost",
          class:
            "bg-transparent text-accent-500 hover:bg-transparent hover:text-accent-700 active:bg-transparent active:text-accent-900 disabled:bg-transparent disabled:text-accent-300 disabled:opacity-100 aria-disabled:bg-transparent aria-disabled:text-accent-300 aria-disabled:opacity-100 focus-visible:bg-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
        },
        {
          color: "accent",
          variant: "ghost",
          size: "xl",
          class: {
            base: "gap-space-xs px-space-xs py-space-2xs text-sm leading-[1.3]",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
        },
        {
          color: "primary",
          variant: "ghost",
          size: "xl",
          class: {
            base: "gap-space-xs px-space-xs py-space-2xs text-sm leading-[1.3]",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
        },
      ],
    },
    slider: {
      slots: {
        thumb: "ring-1",
      },
    },
    tabs: {
      slots: {
        trigger:
          "font-sans focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary!",
      },
    },
  },
});
