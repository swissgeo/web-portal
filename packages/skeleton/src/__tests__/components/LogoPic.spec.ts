import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import LogoPic from "@/components/LogoPic.vue";

describe("LogoPic behavior", () => {
  // returns a wrapper around the component, with the
  function mountWithDesktop(isDesktop?: boolean, condensed?: boolean) {
    return mount(LogoPic, {
      props: {
        condensed: condensed,
      },
      global: {
        provide: isDesktop !== undefined ? { isDesktop } : {},
      },
    });
  }

  it.each`
    description                                                                                                                                                                  | isDesktop    | condensed
    ${"We should only see the condensed logo if we are on Desktop and the condensed prop is true"}                                                                               | ${true}      | ${true}
    ${"We should only see the extended logo if we are on Desktop and condensed prop is false"}                                                                                   | ${true}      | ${false}
    ${"We should only see the extended logo if we are on Desktop and condensed prop is undefined"}                                                                               | ${true}      | ${undefined}
    ${"By default, if isDesktop is not injected, we are considered to be on desktop. We should only see the condensed logo if we are on Desktop and the condensed prop is true"} | ${undefined} | ${true}
    ${"By default, if isDesktop is not injected, we are considered to be on desktop. We should only see the extended logo if we are on Desktop and condensed prop is false"}     | ${undefined} | ${false}
    ${"By default, if isDesktop is not injected, we are considered to be on desktop. We should only see the extended logo if we are on Desktop and condensed prop is undefined"} | ${undefined} | ${undefined}
    ${"We should only see the condensed logo if we are on Mobile and the condensed prop is true"}                                                                                | ${false}     | ${true}
    ${"We should see both the extended logo and the separator if we are on Mobile and the condensed prop is false"}                                                              | ${false}     | ${false}
    ${"We should see both the extended logo and the separator if we are on Mobile and the condensed prop is undefined"}                                                          | ${false}     | ${undefined}
  `("$description", ({ _, isDesktop, condensed }) => {
    // wrapping the logo pic with the correct booleans
    const wrapper = mountWithDesktop(isDesktop, condensed);

    // trying to find the various components
    const condensedLogoPic = wrapper.find(
      `[data-testid="sidebar-logo-pic-condensed"]`,
    );
    const extendedLogoPic = wrapper.find(
      `[data-testid="sidebar-logo-pic-extended"]`,
    );
    const separator = wrapper.find(
      `[data-testid="sidebar-logo-pic-separator"]`,
    );

    // verification booleans
    const condensedExist: boolean = condensed ?? false;
    const separatorExist: boolean = !(isDesktop ?? true) && !condensedExist;

    expect(condensedLogoPic.exists()).toBe(condensedExist);
    expect(extendedLogoPic.exists()).toBe(!condensedExist);
    expect(separator.exists()).toBe(separatorExist);
  });
});
