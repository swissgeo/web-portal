# CONTRIBUTION

## Architecture / Programming Principles

Below are some principles to help take decisions when developing the project. These are meant to convey some of the ideas on how the code is set up and hopefully help understand some of the structure of the code.

> [!NOTE]
> some notes on the _terminology_: the word _state_ is herein used meaning basically anything that holds a value. So as soon as a bunch of variables are assigned a value, these form a "state". There are different kinds of state:
>
> - component state: every component has state in it's setup function
> - pinina store state: these are states that are shared horizontally between components
> - composable state: also composables have their own state

### Keep the state scope as small as possible

For every information, one should consider the scope of it's use. From the book The Pragmatic Programmer: [Shared state is invalid state](https://media.pragprog.com/titles/tpp20/shared-state.pdf).

Of course, state needs to be passed around. For that, Vue follows the principle of: prop in, event out. We pass state via prop _to_ the child component and out _from_ the child via event (emit). If we follow this, then the possibility for error becomse already much smaller.

_basically this principle is the same as with any procedural programming language: pass in data to a function, get it returned. Within the function the scope of the data is narrowed to that function_

### Consider the flow of data

Apart from the flow of data between child/parent components, also consider the flow of data globally: what data gets passed around in what direction. It's all too easy to start providing state to some component, then 5 child components later we mutate the state via store, creating a reactivity loop...

### Avoid stores if possible or use them with intention

Store state is sort of a global state. It is similar to globals as the general programming paradigma: they can be access from everywhere and mutated from everywhere. This goes into above mention: shared state is invalid state.

_This means that tracking the scope, validity and flow of these states (see above) can become difficult._ Especially with a bigger codebase.

Validity: If state is in a component, then when the component gets removed, state is also removed. When the component is re-mounted, then the state is pure and valid.
Scope: as mentioned above, it's sort of global
Flow: Since a pinia store introduces the possibility to mutate the state from everywhere, it becomes quickly unclear what is affected by this change.

_This doesn't mean pinia is evil_. Pinia is very useful. This only means that we should utilize it very intentional. If there's a need for a pinia store, thinking about the overall application architecture for a second goes a long way!

### Vue isn't OOP

Programming with Vue doesn't need object oriented programming paradigms. I don't even think that Vue supports these. OOP in JavaScript is weird anyways. So usually, there should be no need for classes or anything. They're probably not reactive anyway.

### Exploit reactivity

Instead, Vue is a reactive framework: you create a special variable (ref, computed), which updates all it's users on change. This can be leveraged to avoid the need for async/await: there's might be no need to `await` something, just let it reactively update all the dependent data.
A good example of this is the ogc package: here we make several requests to APIs and such, without ever having to worry about promises. The reactivity handles the updating of data itself.

### Avoid package dependencies

If a dependency from one package to the other needs to be introduced, then this might be sign of a poor architecture. It's not unavoidable, yes, but if there's suddenly a need for it, then this is a good time to pause and think of the overall picture. See also below [Package Setup](#Package Setup) for more details about the packages.

### Tailwind first

Usually, it should be enough to use tailwind classes to style something. Stick to that as long as possible and only introduce classes if it's absolutely necessary.

Sometimes the need for introducing a css class that contains the style is also a sign of a poor component architecture. Sometimes, refactoring the components into smaller subcomponents make the css class obsolete.

### Use narrow types

[Typescript hase a structural type system](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html#structural-type-system)

Sometimes it isn't necessary to specify the entire type for a variable. Sometimes, a narrower type is sufficient. To demonstrate what I mean, take a look at [extractDistributionLinks](./packages/ogc/src/records/useDistributionCollection.ts). This function doesn't need the entire `Dataset` type, it works as long as something is passed that has `links` with a specific structure in it. Narrowing this type makes testing easier also.

Narrowing types also means that we can tell the type checking if something really _is_ something. Instead of using a cast (`as`), this can be elegantly solved, for example, like so:

```js
// consider the return type
export const isDatasetLayer = (layer: Layer): layer is DatasetLayer => {
    return layer.type === 'dataset'
}
```

If this is used, from here on the type checker knows that the `layer` variable is of type `DatasetLayer`, without the (unsafe) need for a type cast.

More info about type narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

### Stick to the defaults

Usually, the supporting packages (dts, prettier, nuxt) should be used with their default configuration. If there's a need for diverting from the defaults, then this might be a sign for a underlying problem that we have.

### Unit tests first

In the past, mostly interface testing (with cypress) was done. Testing like this is quite cumbersome and hard to maintain (albeit important). Focus on writing "unit" tests first, if there is some logic to be tested. The next step would be to test components.

**If the components are hard to test because they have a ton of dependencies, then this might be a sign of a poor component architecture.**

### Choosing the test environment (packages/main)

`@nuxt/test-utils` auto-splits the `main` suite into two Vitest projects by filename. Pick the one that matches what the test actually needs:

- **`*.spec.ts` — happy-dom project.** Fast, no Nuxt app booted. Stub Nuxt auto-imports with `mockNuxtImport` (from `@nuxt/test-utils/runtime`) or, for globals like `defineNuxtPlugin`, `vi.hoisted`. This should be the default.
- **`*.nuxt.spec.ts` — nuxt project.** Boots a full Nuxt app per file via `vitest-environment-nuxt`. Use only when the test genuinely exercises Nuxt runtime (router, plugins, real composables). Expensive — several seconds of boot per file.

If a test is hard to write as a `*.spec.ts` because of too many Nuxt entanglements, treat that as a signal to simplify the code — the same "poor architecture" heuristic as above.

**When to use `*.spec.ts` (happy-dom):**

- Testing a component's render, emit, or prop behaviour
- Testing a composable's logic in isolation
- Testing a utility or helper function
- The test stubs its Nuxt dependencies (auto-imports, composables) via `mockNuxtImport` or `vi.mock`

**When to use `*.nuxt.spec.ts` (Nuxt env):**

- Testing Nuxt routing behaviour itself (e.g. verifying that navigating to `/de/map` renders the right page, or that middleware redirects fire)
- Testing plugin interaction or boot order (e.g. `dependsOn` sequencing, `app:created` hook orchestration across plugins)
- Testing SSR or hydration behaviour (e.g. `<ClientOnly>` rendering, server-side HTML output)
- The stub chain has grown too deep (roughly > 5 mocks) and the test is more stub than test — at that point the Nuxt env is cheaper and more trustworthy

When stubbing Nuxt auto-imports, use the centralised mock factories in `packages/main/tests/mock-nuxt-imports.ts` so implementations stay consistent. `mockNuxtImport` is a compile-time macro (string literal required), so each call is explicit — but the factory comes from the shared module:

```ts
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

const { mocks } = await vi.hoisted(async () => {
  const { nuxtMocks } = await import("../../../tests/mock-nuxt-imports");
  return { mocks: nuxtMocks };
});

mockNuxtImport("useRoute", () => mocks.useRoute());
mockNuxtImport("useRouter", () => mocks.useRouter());
```

Run one project at a time with `pnpm exec vitest --project happy-dom` or `--project nuxt`. `packages/main/tests/setup.ts` filters known-harmless Nuxt-boot noise (Vue Router "no match", H3 404, menus fetch) — it only activates in the nuxt project. See `tests/nuxt/i18n-integration.nuxt.spec.ts` for a working example of a nuxt-env test.

## Visions

### Package Setup

The reason for the package setup was initially to be able to provide small functonal packages to be usable by the public. They would be published to the npm registry.

A good example is the map package: if we can keep it "pure", then anyone in need for a map similar to ours can use this package to quickly conjure an app with the map in it. Not all the packages need to be usable by a broad set of people, but _if_ we can provide some packages

Another good side effect of the package setup is that it forces us to keep a clean(er) architecture.

### There will be content

This project isn't a map viewer: this is a portal. There will be CMS content consumed and displayed by the app. _Where this will be displayed, and how the pages interact with the map, that we don't know yet_

### This isn't geoadmin

Previous implementations of the publication platform was done in a way that made it tightly coupled. This made total sense in the past, but this project here needs to be as open as possible for data, ideas, content etc. that isn't managed by geoadmin.
