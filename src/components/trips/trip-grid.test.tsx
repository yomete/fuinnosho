import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TripGrid } from "./trip-grid";
import type { Trip } from "@/lib/trips/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/use-demo-prefix", () => ({
  useDemoPrefix: () => "",
}));

const createTrip = (overrides: Partial<Trip>): Trip => ({
  id: crypto.randomUUID(),
  title: "Test Trip",
  description: "Trip description",
  start_date: "2026-04-01",
  end_date: "2026-04-02",
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  user_id: "user-123",
  status: "upcoming",
  reserved_film_count: 0,
  ...overrides,
});

describe("TripGrid", () => {
  it("renders ongoing trips in their own section", () => {
    render(
      <TripGrid
        trips={[
          createTrip({ title: "Berlin Walk", status: "ongoing" }),
          createTrip({ title: "Lisbon Weekend", status: "upcoming" }),
        ]}
        onTripEdit={vi.fn()}
        onTripComplete={vi.fn()}
      />
    );

    expect(screen.getByText("Ongoing Trips")).toBeInTheDocument();
    expect(screen.getByText("Berlin Walk")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Trips")).toBeInTheDocument();
    expect(screen.getByText("Lisbon Weekend")).toBeInTheDocument();
  });
});
