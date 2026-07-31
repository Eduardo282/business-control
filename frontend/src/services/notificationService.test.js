import { beforeEach, describe, expect, it, vi } from "vitest";

const { fireMock } = vi.hoisted(() => ({
  fireMock: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: fireMock,
  },
}));

import {
  DESTRUCTIVE_CONFIRM_DIALOG_OPTIONS,
  notificationService,
} from "./notificationService";

describe("notificationService.confirm", () => {
  beforeEach(() => {
    fireMock.mockReset();
  });

  it("uses destructive red for confirmation and a readable light cancel button", async () => {
    fireMock.mockResolvedValue({ isConfirmed: true });

    await expect(
      notificationService.confirm({
        title: "¿Eliminar registro?",
        confirmButtonText: "Sí, eliminar",
      }),
    ).resolves.toBe(true);

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#f4f4f5",
        customClass: {
          cancelButton: "swal-cancel-button-light",
        },
      }),
    );
  });

  it("exposes the shared destructive confirmation palette", () => {
    expect(DESTRUCTIVE_CONFIRM_DIALOG_OPTIONS).toEqual({
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#f4f4f5",
      customClass: {
        cancelButton: "swal-cancel-button-light",
      },
    });
  });
});
