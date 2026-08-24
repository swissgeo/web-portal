import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import IconButton from "@/components/IconButton.vue";

function mountButton(attrs: Record<string, unknown> = {}) {
  return mount(IconButton, {
    attrs: {
      "data-testid": "icon-button",
      ...attrs,
    },
  }).get('[data-testid="icon-button"]');
}

describe("IconButton", () => {
  it("maps the icon name to a Lucide icon", () => {
    const button = mountButton({ iconName: "Circle-Check" });

    expect(button.attributes("icon")).toBe("i-lucide-circle-check");
  });

  it("accepts an undefined icon name", () => {
    const button = mountButton({ iconName: undefined });

    expect(button.attributes("icon")).toBe("");
  });

  it("keeps the icon name authoritative", () => {
    const button = mountButton({
      icon: "i-lucide-x",
      iconName: "Circle-Check",
    });

    expect(button.attributes("icon")).toBe("i-lucide-circle-check");
  });

  it("uses the transparent Figma button mapping by default", () => {
    const button = mountButton();

    expect(button.attributes("color")).toBe("primary");
    expect(button.attributes("variant")).toBe("ghost");
  });

  it("keeps an explicit false text flag on the default mapping", () => {
    const button = mountButton({ text: false });

    expect(button.attributes("color")).toBe("primary");
    expect(button.attributes("variant")).toBe("ghost");
  });

  it.each`
    severity       | color        | variant
    ${"primary"}   | ${"primary"} | ${"solid"}
    ${"secondary"} | ${"primary"} | ${"ghost"}
    ${"neutral"}   | ${"primary"} | ${"ghost"}
    ${"danger"}    | ${"error"}   | ${"solid"}
    ${"success"}   | ${"success"} | ${"solid"}
    ${"info"}      | ${"info"}    | ${"solid"}
    ${"warning"}   | ${"warning"} | ${"solid"}
  `("maps $severity to $color + $variant", ({ severity, color, variant }) => {
    const button = mountButton({ severity });

    expect(button.attributes("color")).toBe(color);
    expect(button.attributes("variant")).toBe(variant);
  });

  it("uses the default mapping for an unsupported legacy severity", () => {
    const button = mountButton({ severity: "anvil" });

    expect(button.attributes("color")).toBe("primary");
    expect(button.attributes("variant")).toBe("ghost");
  });

  it("keeps the legacy text mode transparent", () => {
    const button = mountButton({ severity: "primary", text: true });

    expect(button.attributes("color")).toBe("primary");
    expect(button.attributes("variant")).toBe("ghost");
  });

  it("accepts explicit Nuxt UI color and variant values", () => {
    const button = mountButton({ color: "error", variant: "outline" });

    expect(button.attributes("color")).toBe("error");
    expect(button.attributes("variant")).toBe("outline");
  });

  it("forwards native button attributes", () => {
    const button = mountButton({
      customAttribute: "custom value",
      disabled: true,
      title: "Unavailable",
    });

    expect(button.attributes("customattribute")).toBe("custom value");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("title")).toBe("Unavailable");
  });
});
