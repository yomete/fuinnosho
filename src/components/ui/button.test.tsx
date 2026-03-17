import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the minimum hit area classes for small and icon sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" })).toHaveClass("min-h-10");

    rerender(
      <Button size="icon" aria-label="Icon action">
        +
      </Button>
    );
    expect(screen.getByRole("button", { name: "Icon action" })).toHaveClass("size-10");
  });

  it("keeps press-scale by default and disables it with static", () => {
    const { rerender } = render(<Button>Default</Button>);
    expect(screen.getByRole("button", { name: "Default" })).toHaveClass("active:scale-[0.96]");

    rerender(<Button static>Static</Button>);
    const staticButton = screen.getByRole("button", { name: "Static" });
    expect(staticButton).toHaveClass("active:scale-100");
  });
});
