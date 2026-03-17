import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

describe("Dialog", () => {
  it("renders a close control with keyboard focus affordance", async () => {
    const user = userEvent.setup();

    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveClass("focus:ring-2");
    expect(closeButton).toHaveClass("focus:ring-offset-2");

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it("keeps the close control visually compact but explicit", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    const closeIcon = closeButton.querySelector("svg");

    expect(closeButton).toHaveClass("absolute");
    expect(closeButton).toHaveClass("right-4");
    expect(closeButton).toHaveClass("top-4");
    expect(closeIcon).toHaveClass("h-4");
    expect(closeIcon).toHaveClass("w-4");
  });
});
