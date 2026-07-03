import type { AppStatePayload } from "~/composables/useStateConfig";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import {
  useCreateShareLink,
  useCreateShareLinkForCustomState,
  useCreateShareLinkForPrint,
} from "~/composables/useCreateShareLink";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive, ref } from "vue";

const { mockPostState, mockUseMapViewStore, mockUseStateConfig } = vi.hoisted(
  () => ({
    mockPostState: vi.fn(),
    mockUseMapViewStore: vi.fn(),
    mockUseStateConfig: vi.fn(),
  }),
);

mockNuxtImport("useMapViewStore", () => mockUseMapViewStore);
mockNuxtImport("useStateConfig", () => mockUseStateConfig);

vi.mock("~/utils/postStateToStateId", () => ({
  postStateToStateId: mockPostState,
}));

function makeState(zoom = 8): AppStatePayload {
  return {
    version: "1.0",
    state: {
      map: {
        center: [2_600_000, 1_200_000],
        zoom,
        rotation: 0,
      },
      layers: [],
    },
  };
}

describe("useCreateShareLink", () => {
  beforeEach(() => {
    mockPostState.mockReset();
    mockUseStateConfig.mockReset();
    mockUseMapViewStore.mockReset();
    mockUseStateConfig.mockReturnValue({ exportState: ref(makeState()) });
    mockUseMapViewStore.mockReturnValue(reactive({ stateId: "" }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes a tracked state on demand and builds share outputs", async () => {
    mockPostState.mockResolvedValueOnce("state-id");
    const state = ref<AppStatePayload | null>(makeState());
    const zoomOnlyCtrl = ref(false);
    const share = useCreateShareLink(state, { zoomOnlyCtrl });

    expect(share.shareLink.value).toBe("");
    expect(share.embedCode.value).toBe("");
    expect(share.needToRefresh.value).toBe(true);
    expect(mockPostState).not.toHaveBeenCalled();

    await share.refresh();

    expect(mockPostState).toHaveBeenCalledWith(state.value!.state, {
      signal: expect.any(AbortSignal),
    });
    expect(share.hash.value).toBe("state-id");
    expect(share.shareLink.value).toBe(
      new URL(`/?state=state-id`, location.origin).href,
    );
    expect(share.embedCode.value).toContain(
      new URL(`/embed?state=state-id`, location.origin).href,
    );
    expect(share.needToRefresh.value).toBe(false);

    zoomOnlyCtrl.value = true;
    expect(share.embedCode.value).toContain("zoomOnlyCtrl=true");

    state.value = makeState(9);
    await nextTick();
    expect(share.needToRefresh.value).toBe(true);
  });

  it("uses useStateConfig when no explicit state is supplied", async () => {
    const exportedState = ref(makeState(10));
    mockUseStateConfig.mockReturnValue({ exportState: exportedState });
    mockPostState.mockResolvedValueOnce("exported-state");

    const share = useCreateShareLink();
    await share.refresh();

    expect(mockPostState).toHaveBeenCalledWith(exportedState.value.state, {
      signal: expect.any(AbortSignal),
    });
    expect(share.hash.value).toBe("exported-state");
  });

  it("automatically refreshes immediately and after state changes", async () => {
    mockPostState
      .mockResolvedValueOnce("initial-state")
      .mockResolvedValueOnce("updated-state");
    const state = ref<AppStatePayload | null>(makeState());
    const share = useCreateShareLink(state, { autoRefresh: true });
    await flushPromises();

    expect(share.hash.value).toBe("initial-state");
    expect(share.needToRefresh.value).toBe(false);

    state.value = makeState(11);
    await nextTick();
    await flushPromises();

    expect(mockPostState).toHaveBeenCalledTimes(2);
    expect(share.hash.value).toBe("updated-state");
  });

  it("does nothing when refreshed without a state", async () => {
    const share = useCreateShareLink(ref(null));

    await share.refresh();

    expect(mockPostState).not.toHaveBeenCalled();
    expect(share.hash.value).toBeNull();
  });

  it("derives the print share link from the map view state id", () => {
    const mapViewStore = reactive({ stateId: "" });
    mockUseMapViewStore.mockReturnValue(mapViewStore);
    const { shareLink } = useCreateShareLinkForPrint();

    expect(shareLink.value).toBe("");

    mapViewStore.stateId = "print-state";
    expect(shareLink.value).toBe(
      new URL(`/?state=print-state`, location.origin).href,
    );
  });

  it("posts custom state changes and exposes their share link", async () => {
    mockPostState.mockResolvedValueOnce("custom-state");
    const customShare = useCreateShareLinkForCustomState();
    const state = makeState();

    customShare.state.value = state;
    await nextTick();
    await flushPromises();

    expect(mockPostState).toHaveBeenCalledWith(state.state, {
      signal: expect.any(AbortSignal),
    });
    expect(customShare.hash.value).toBe("custom-state");
    expect(customShare.shareLink.value).toBe(
      new URL(`/?state=custom-state`, location.origin).href,
    );

    customShare.state.value = null;
    await nextTick();
    expect(customShare.hash.value).toBeNull();
  });

  it("encodes custom state locally when portable state is forced", async () => {
    vi.useFakeTimers();
    const customShare = useCreateShareLinkForCustomState(true);
    const state = makeState();

    customShare.state.value = state;
    await nextTick();
    await vi.advanceTimersByTimeAsync(500);

    expect(customShare.hash.value).toBe(btoa(JSON.stringify(state)));
    expect(mockPostState).not.toHaveBeenCalled();

    customShare.state.value = null;
    await nextTick();
    await vi.advanceTimersByTimeAsync(500);
    expect(customShare.hash.value).toBeNull();
  });
});
