import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";

import IconButton from "@/components/IconButton.vue";

describe("Functionality of buttons with a LucideIcon within", () => {
  const iconName = "a-beAutifUl-cirCle";
  const expectedIcon = "i-lucide-a-beautiful-circle";
  const testId = `button-icon-${expectedIcon}`;

  it.each`
    description                                        | name         | icon
    ${"ensure icon name is used correctly as an icon"} | ${iconName}  | ${expectedIcon}
    ${"we can give an undefined icon name too"}        | ${undefined} | ${""}
  `("$description", ({ _, name, icon }) => {
    const wrapper = mount(IconButton, {
      attrs: {
        iconName: name,
        "data-testid": testId,
      },
    });
    const iconButton = wrapper.find(`[data-testid="${testId}"]`);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.attributes().icon).to.eql(icon);
  });

  it.each`
    description                                                      | text         | severity     | requestedVariant | variant
    ${"Use an explicit variant"}                                     | ${true}      | ${"neutral"} | ${"outline"}     | ${"outline"}
    ${"Use ghost for the legacy text attribute"}                     | ${true}      | ${"neutral"} | ${undefined}     | ${"ghost"}
    ${"Use soft for ordinary neutral actions"}                       | ${undefined} | ${"neutral"} | ${undefined}     | ${"soft"}
    ${"Use solid for primary actions"}                               | ${undefined} | ${"primary"} | ${undefined}     | ${"solid"}
    ${"Use the neutral default for an unsupported explicit variant"} | ${undefined} | ${undefined} | ${"fantasy"}     | ${"soft"}
  `("$description", ({ _, text, severity, requestedVariant, variant }) => {
    const wrapper = mount(IconButton, {
      attrs: {
        iconName,
        text,
        severity,
        variant: requestedVariant,
        "data-testid": testId,
      },
    });
    const iconButton = wrapper.find(`[data-testid="${testId}"]`);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.attributes().icon).to.eql(expectedIcon);
    expect(iconButton.attributes().variant).to.eql(variant);
  });

  it.each`
    description                                    | severity       | color
    ${"Handle primary severity regarding style"}   | ${"primary"}   | ${"primary"}
    ${"Map danger severity to the Nuxt UI error"}  | ${"danger"}    | ${"error"}
    ${"Handle error severity regarding style"}     | ${"error"}     | ${"error"}
    ${"Handle success severity regarding style"}   | ${"success"}   | ${"success"}
    ${"Handle warning severity regarding style"}   | ${"warning"}   | ${"warning"}
    ${"Handle info severity regarding style"}      | ${"info"}      | ${"info"}
    ${"Handle neutral severity regarding style"}   | ${"neutral"}   | ${"neutral"}
    ${"Handle secondary severity regarding style"} | ${"secondary"} | ${"secondary"}
    ${"Handle fantasy severity regarding style"}   | ${"anvil"}     | ${"neutral"}
    ${"Handle nullis severity regarding style"}    | ${undefined}   | ${"neutral"}
  `("$description", ({ _, severity, color }) => {
    const wrapper = mount(IconButton, {
      attrs: {
        iconName,
        severity,
        "data-testid": testId,
      },
    });
    const iconButton = wrapper.find(`[data-testid="${testId}"]`);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.attributes().color).to.eql(color);
  });

  it("passes other attributes to the iconButton directly, in lowercase form", () => {
    const customattribute = "a custom attribute";
    const wrapper = mount(IconButton, {
      attrs: {
        iconName,
        customAttribute: customattribute,
        "data-testid": testId,
      },
    });
    const iconButton = wrapper.find(`[data-testid="${testId}"]`);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.attributes().customattribute).to.eql(customattribute);
  });

  it("keeps the severity and generated icon while allowing a variant", () => {
    const wrapper = mount(IconButton, {
      attrs: {
        iconName,
        severity: "primary",
        text: true,
        color: "success",
        variant: "solid",
        icon: "i-lucide-not-the-good-one",
        "data-testid": testId,
      },
    });
    const iconButton = wrapper.find(`[data-testid="${testId}"]`);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.attributes().icon).to.eql(expectedIcon);
    expect(iconButton.attributes().variant).to.eql("solid");
    expect(iconButton.attributes().color).to.eql("primary");
  });
});
