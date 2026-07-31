import { describe, expect, it } from "vitest";

import {
  getQuoteDisplayStatus,
  getQuoteStatusAfterSend,
} from "./quoteStatus.js";

describe("getQuoteDisplayStatus", () => {
  it("prioritizes rejection over every other state", () => {
    expect(
      getQuoteDisplayStatus({
        status: "RECHAZADA",
        is_registered: true,
        is_sent_to_client_portal: true,
      }),
    ).toBe("RECHAZADA");
  });

  it("shows sent after registration and portal publication", () => {
    expect(
      getQuoteDisplayStatus({
        status: "ENVIADA",
        is_registered: true,
        is_sent_to_client_portal: true,
      }),
    ).toBe("ENVIADA");
  });

  it("shows accepted only when it is the persisted status", () => {
    expect(
      getQuoteDisplayStatus({
        status: "ACEPTADA",
        is_registered: true,
        is_sent_to_client_portal: true,
      }),
    ).toBe("ACEPTADA");
  });

  it("shows sent when email was delivered but portal publication is incomplete", () => {
    expect(
      getQuoteDisplayStatus({
        status: "ENVIADA",
        is_registered: false,
        is_sent_to_client_portal: false,
      }),
    ).toBe("ENVIADA");
  });

  it("shows pending before registration and portal publication", () => {
    expect(
      getQuoteDisplayStatus({
        status: "PENDIENTE",
        is_registered: false,
        is_sent_to_client_portal: false,
      }),
    ).toBe("PENDIENTE");
  });
});

describe("getQuoteStatusAfterSend", () => {
  it("marks non-terminal quotes as sent", () => {
    expect(getQuoteStatusAfterSend("PENDIENTE")).toBe("ENVIADA");
    expect(getQuoteStatusAfterSend("SOLICITADA")).toBe("ENVIADA");
  });

  it("preserves explicit terminal statuses", () => {
    expect(getQuoteStatusAfterSend("ACEPTADA")).toBe("ACEPTADA");
    expect(getQuoteStatusAfterSend("RECHAZADA")).toBe("RECHAZADA");
  });
});
