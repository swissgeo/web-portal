import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useRouteMock, useRouterMock, fetchStateMock } = vi.hoisted(() => ({
  useRouteMock: {
    query: {
      state: "ABC",
    },
  } as {
    query: {
      state?: string | string[];
      statestr?: string;
    };
  },
  useRouterMock: {
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
    replace: vi.fn(),
  },
  fetchStateMock: vi.fn(() => Promise.resolve("success")),
}));

// Mock navigateTo
mockNuxtImport("navigateTo", () => vi.fn());

// immediately invoke the callback
mockNuxtImport("onNuxtReady", () => {
  return (fn: () => void) => fn();
});

mockNuxtImport("useRouter", () => {
  return () => ({
    ...useRouterMock,
  });
});

mockNuxtImport("useRoute", () => {
  return () => ({
    ...useRouteMock,
  });
});

vi.mock("~/utils/fetchStateFromStateId", () => ({
  fetchStateFromStateId: fetchStateMock,
}));

describe("useUrlParams state extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // for some reason, if this isn't the first test in the sequence, it will fail
  // I tried increasing the timeout, didn't really help. I suspect there is something
  // fishy with our test setup, and created GPS-629 to investigate that
  it("Calls the fetchState util", async () => {
    const { getStateFromUrl } = useUrlParams();
    await getStateFromUrl();
    expect(fetchStateMock).toHaveBeenLastCalledWith("ABC");
  });

  it("Extracts the state id from the URL correctly", () => {
    const { getStateIdFromUrl } = useUrlParams();

    const stateId = getStateIdFromUrl();
    expect(stateId).toEqual("ABC");
  });

  it("Extracts the first state param if there are multiple", () => {
    useRouteMock.query.state = ["DEF", "GHI"];
    const { getStateIdFromUrl } = useUrlParams();

    const stateId = getStateIdFromUrl();
    expect(stateId).toEqual("DEF");
  });

  it("Returns null if there's no state param", () => {
    useRouteMock.query = {
      // @ts-expect-error Specifying another param to test the absence
      anotherParam: "value",
    };
    const { getStateIdFromUrl } = useUrlParams();

    const stateId = getStateIdFromUrl();
    expect(stateId).toBeNull();
  });

  it("Returns null if the state id isn't a string", () => {
    useRouteMock.query = {
      // @ts-expect-error Intentionally breaking the type here
      state: 3,
    };
    const { getStateIdFromUrl } = useUrlParams();

    const stateId = getStateIdFromUrl();
    expect(stateId).toBeNull();
  });

  it("Returns a promise with null if the's no state param", async () => {
    useRouteMock.query = {
      // @ts-expect-error Specifying another param to test the absence
      anotherParam: "value",
    };
    const { getStateFromUrl } = useUrlParams();
    const getStateSpy = vi.fn(getStateFromUrl);
    const state = await getStateSpy();
    expect(getStateSpy).toHaveResolved();
    expect(state).toMatchObject({ state: null, stateId: null });
  });
});

describe("useUrlParam base64 state extraction", () => {
  beforeEach(() => {
    useRouteMock.query = {
      // intentionally providing a fixed value here. The content is irrelevant for this test
      statestr:
        "ewogICJ2ZXJzaW9uIjogIjEuMCIsCiAgInN0YXRlIjogewogICAgIm1hcCI6IHsKICAgICAgImNlbnRlciI6IFsKICAgICAgICAyNjYwMDAwLAogICAgICAgIDExOTAwMDAKICAgICAgXQogICB9CiAgfQp9",
    };

    vi.clearAllMocks();
  });

  it("extracts a state from base64", () => {
    const { getB64State } = useUrlParams();
    const state = getB64State();
    expect(state).toEqual({
      version: "1.0",
      state: {
        map: {
          center: [2660000, 1190000],
        },
      },
    });
  });

  it("drops the parameter after importing the base64 state", () => {
    const { getB64State } = useUrlParams();
    expect(useRouteMock.query).toHaveProperty("statestr");

    const state = getB64State();
    expect(state).toBeTruthy();
    expect(useRouterMock.replace).toHaveBeenCalledWith({ query: {} });
  });
});
