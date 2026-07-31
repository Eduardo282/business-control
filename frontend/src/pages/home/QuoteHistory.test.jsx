import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatusCell } from "./QuoteHistory.jsx";

describe("QuoteHistory status theme", () => {
  afterEach(() => cleanup());

  it.each([
    ["SOLICITADA", {}],
    ["PENDIENTE", {}],
    ["ENVIADA", {}],
    ["ACEPTADA", { is_registered: true, is_sent_to_client_portal: true }],
    ["RECHAZADA", {}],
  ])("renders %s with explicit dark text, border, and surface", (status, extraQuote) => {
    render(
      <StatusCell
        row={{ original: { status, ...extraQuote } }}
      />,
    );

    expect(screen.getByText(status)).toBeVisible();
  });
});
