import type { ComponentPublicInstance } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ref } from "vue";

import ReportIssue from "@/components/toolbox/reportIssue/ReportIssue.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("~/stores/toolbox", () => ({
  useToolboxStore: vi.fn(() => ({
    closeDetailPanel: vi.fn(),
  })),
}));

vi.mock("@/composables/useStateConfig", () => ({
  useStateConfig: vi.fn(() => ({
    exportState: ref({}),
  })),
}));

vi.mock("@/composables/useCreateShareLink", () => ({
  useCreateShareLink: vi.fn(() => ({
    shareLink: ref(""),
  })),
}));

const { fetchMock, toastAdd } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toastAdd: vi.fn(),
}));

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { version: "test-v1.0", maxFileSizeMB: 250 },
}));

mockNuxtImport("useToast", () => () => ({ add: toastAdd }));

mockNuxtImport("$fetch", () => fetchMock);

const globalStubs = {
  UCard: {
    name: "UCard",
    template: "<div><slot /><slot name='header' /></div>",
  },
  UForm: {
    name: "UForm",
    template: "<form @submit.prevent='$emit(\"submit\")'><slot /></form>",
    props: ["schema", "state"],
    emits: ["submit"],
  },
  UFormField: {
    name: "UFormField",
    template: "<div><slot /></div>",
    props: ["label", "name"],
  },
  UButton: {
    name: "UButton",
    template: '<button :type="type" :disabled="disabled"><slot /></button>',
    props: ["type", "color", "variant", "disabled"],
  },
  ReportIssueCategory: {
    name: "ReportIssueCategory",
    template: "<div />",
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  ReportIssueFeedback: {
    name: "ReportIssueFeedback",
    template: "<div />",
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  ReportIssueDrawOnMap: { name: "ReportIssueDrawOnMap", template: "<div />" },
  ReportIssueEmail: {
    name: "ReportIssueEmail",
    template: "<div />",
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  ReportIssueAttachment: {
    name: "ReportIssueAttachment",
    template: "<div />",
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
  ReportIssueNotes: {
    name: "ReportIssueNotes",
    template: "<div />",
    props: ["permalink"],
  },
};

function mountReportIssue() {
  return shallowMount(ReportIssue, {
    global: { stubs: globalStubs },
  });
}

type ReportIssueVm = ComponentPublicInstance & {
  state: {
    category: string;
    feedback: string;
    email: string | undefined;
    attachment: File | undefined;
  };
  pending: { value: boolean };
  onSubmit: (_event: never) => Promise<void>;
};

describe("ReportIssue.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    const wrapper = mountReportIssue();
    expect(wrapper.text()).toContain("toolbox.reportIssue.title");
  });

  it("submits form and calls $fetch with correct FormData", async () => {
    fetchMock.mockResolvedValue({ feedback_id: "123", success: true });

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.category = "thematic";
    vm.state.feedback = "Test feedback";
    vm.state.email = "test@example.com";

    await vm.onSubmit({} as never);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: FormData },
    ];
    expect(options.method).toBe("POST");

    const body = options.body as FormData;
    expect(body.get("subject")).toBe("[Problem Report]");
    expect(body.get("feedback")).toBe("Test feedback");
    expect(body.get("category")).toBe("thematic");
    expect(body.get("version")).toBe("test-v1.0");
    expect(body.get("email")).toBe("test@example.com");
  });

  it("includes attachment in FormData when present", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    const file = new File(["test"], "test.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });
    vm.state.feedback = "with file";
    vm.state.category = "other";
    vm.state.attachment = file;

    await vm.onSubmit({} as never);

    const body = fetchMock.mock.calls[0]![1].body as FormData;
    expect(body.get("attachment")).toBeInstanceOf(Blob);
  });

  it("does not include email in FormData when undefined", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "no email";
    vm.state.category = "application";
    vm.state.email = undefined;

    await vm.onSubmit({} as never);

    const body = fetchMock.mock.calls[0]![1].body as FormData;
    expect(body.has("email")).toBe(false);
  });

  it("shows success toast on successful submit", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "ok";
    vm.state.category = "other";

    await vm.onSubmit({} as never);

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: "success" }),
    );
  });

  it("resets form after successful submit", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "to reset";
    vm.state.category = "thematic";
    vm.state.email = "reset@test.com";

    await vm.onSubmit({} as never);

    expect(vm.state.feedback).toBe("");
    expect(vm.state.category).toBe("");
    expect(vm.state.email).toBeUndefined();
  });

  it("shows error toast with message on Error", async () => {
    fetchMock.mockRejectedValue(new Error("Network failure"));

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "err";
    vm.state.category = "other";

    await vm.onSubmit({} as never);

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "Network failure",
      }),
    );
  });

  it("shows i18n error message on non-Error", async () => {
    fetchMock.mockRejectedValue("something");

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "err";
    vm.state.category = "other";

    await vm.onSubmit({} as never);

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "error",
        title: "toolbox.reportIssue.errorMessage",
      }),
    );
  });

  it("disables submit button during pending state", async () => {
    let resolveFetch!: (_value: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const wrapper = mountReportIssue();
    const vm = wrapper.vm as unknown as ReportIssueVm;

    vm.state.feedback = "pending test";
    vm.state.category = "other";

    const submitPromise = vm.onSubmit({} as never);
    await wrapper.vm.$nextTick();

    const submitButton = wrapper
      .findAll("button")
      .find((b) => b.text() === "toolbox.reportIssue.submitButton");
    expect(submitButton?.attributes("disabled")).toBeDefined();

    resolveFetch({ ok: true });
    await submitPromise;
    await wrapper.vm.$nextTick();

    expect(submitButton?.attributes("disabled")).toBeUndefined();
  });
});
