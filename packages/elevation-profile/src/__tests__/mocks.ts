import { vi } from "vitest";

export type MockCtx = {
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  fillStyle: string;
  font: string;
  textAlign: string;
  lineWidth: number;
  strokeStyle: string;
  measureText: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  strokeText: ReturnType<typeof vi.fn>;
};

export function makeCtx(): MockCtx {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: "",
    font: "",
    textAlign: "",
    lineWidth: 0,
    strokeStyle: "",
    measureText: vi.fn(() => ({ width: 50 })),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
  };
}
