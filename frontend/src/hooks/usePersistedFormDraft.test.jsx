import { useState } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteFormDraftApi,
  getFormDraftApi,
  upsertFormDraftApi,
} from "../actionsAPI/formDrafts.api";
import { usePersistedFormDraft } from "./usePersistedFormDraft";

vi.mock("../actionsAPI/formDrafts.api", () => ({
  deleteFormDraftApi: vi.fn(),
  getFormDraftApi: vi.fn(),
  upsertFormDraftApi: vi.fn(),
}));

vi.mock("../services/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("usePersistedFormDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFormDraftApi.mockResolvedValue(null);
    deleteFormDraftApi.mockResolvedValue(undefined);
    upsertFormDraftApi.mockResolvedValue(undefined);
  });

  it("loads a draft scope without saving until save is enabled", async () => {
    const { result, rerender } = renderHook(
      ({ data, saveEnabled }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey: "request:v2:55",
          data,
          debounceMs: 0,
          saveEnabled,
        }),
      {
        initialProps: {
          data: { items: [{ id: "old-admin-item" }] },
          saveEnabled: false,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
      expect(result.current.readyScopeKey).toBe("request:v2:55");
    });

    rerender({
      data: { items: [{ id: "requested-item" }] },
      saveEnabled: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(upsertFormDraftApi).not.toHaveBeenCalled();

    rerender({
      data: { items: [{ id: "requested-item" }] },
      saveEnabled: true,
    });

    await waitFor(() =>
      expect(upsertFormDraftApi).toHaveBeenCalledWith({
        form_key: "create-quote",
        scope_key: "request:v2:55",
        data: { items: [{ id: "requested-item" }] },
      }),
    );
  });

  it("can skip restoring a draft while still allowing later saves", async () => {
    const { result, rerender } = renderHook(
      ({ data, saveEnabled }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey: "request:v2:23",
          data,
          debounceMs: 0,
          loadEnabled: false,
          saveEnabled,
        }),
      {
        initialProps: {
          data: { items: [] },
          saveEnabled: false,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
      expect(result.current.readyScopeKey).toBe("request:v2:23");
    });
    expect(getFormDraftApi).not.toHaveBeenCalled();

    rerender({
      data: { items: [{ id: "source-item" }] },
      saveEnabled: true,
    });

    await waitFor(() =>
      expect(upsertFormDraftApi).toHaveBeenCalledWith({
        form_key: "create-quote",
        scope_key: "request:v2:23",
        data: { items: [{ id: "source-item" }] },
      }),
    );
  });

  it("executes an immediate delete after an in-flight autosave completes", async () => {
    let resolveUpsert;
    const upsertFinished = new Promise((resolve) => {
      resolveUpsert = resolve;
    });
    const operationOrder = [];

    upsertFormDraftApi.mockImplementation(async () => {
      operationOrder.push("upsert:start");
      await upsertFinished;
      operationOrder.push("upsert:end");
    });
    deleteFormDraftApi.mockImplementation(async () => {
      operationOrder.push("delete");
    });

    const { result, rerender } = renderHook(
      ({ data }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey: "request:v2:55",
          data,
          debounceMs: 0,
          isMeaningfulDraft: (draft) => Boolean(draft.items?.length),
        }),
      {
        initialProps: {
          data: { items: [] },
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
    });

    rerender({
      data: { items: [{ id: "pending-item" }] },
    });

    await waitFor(() => {
      expect(operationOrder).toEqual(["upsert:start"]);
    });

    let deletePromise;
    await act(async () => {
      deletePromise = result.current.deleteDraftNow();
      await Promise.resolve();
    });

    expect(deleteFormDraftApi).not.toHaveBeenCalled();

    await act(async () => {
      resolveUpsert();
      await deletePromise;
    });

    expect(operationOrder).toEqual(["upsert:start", "upsert:end", "delete"]);
    expect(deleteFormDraftApi).toHaveBeenCalledWith(
      "create-quote",
      "request:v2:55",
    );
  });

  it("executes a queued delete after an in-flight autosave fails", async () => {
    const upsertDeferred = createDeferred();
    const operationOrder = [];

    upsertFormDraftApi.mockImplementation(async () => {
      operationOrder.push("upsert:start");
      await upsertDeferred.promise;
    });
    deleteFormDraftApi.mockImplementation(async () => {
      operationOrder.push("delete");
    });

    const { result, rerender } = renderHook(
      ({ data }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey: "request:v2:failed-queue",
          data,
          debounceMs: 0,
          isMeaningfulDraft: (draft) => Boolean(draft.items?.length),
        }),
      {
        initialProps: {
          data: { items: [] },
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
    });

    rerender({ data: { items: [{ id: "pending-item" }] } });
    await waitFor(() => {
      expect(operationOrder).toEqual(["upsert:start"]);
    });

    rerender({ data: { items: [] } });
    expect(deleteFormDraftApi).not.toHaveBeenCalled();

    await act(async () => {
      upsertDeferred.reject(new Error("upsert failed"));
      await upsertDeferred.promise.catch(() => undefined);
    });

    await waitFor(() => {
      expect(operationOrder).toEqual(["upsert:start", "delete"]);
    });
    expect(deleteFormDraftApi).toHaveBeenCalledWith(
      "create-quote",
      "request:v2:failed-queue",
    );
  });

  it("waits for a queued scope deletion before reloading that scope", async () => {
    const deleteDeferred = createDeferred();
    const loadedDraft = { items: [{ id: "stale-item" }] };
    const loadedValues = [];
    let serverDraft = loadedDraft;

    getFormDraftApi.mockImplementation((formKey, scopeKey) =>
      Promise.resolve(
        scopeKey === "request:v2:A" && serverDraft
          ? { data_json: JSON.stringify(serverDraft) }
          : null,
      ),
    );
    deleteFormDraftApi.mockImplementation(async (formKey, scopeKey) => {
      await deleteDeferred.promise;
      if (scopeKey === "request:v2:A") serverDraft = null;
    });

    const { result, rerender } = renderHook(
      ({ data, scopeKey }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey,
          data,
          debounceMs: 0,
          isMeaningfulDraft: (value) => Boolean(value.items?.length),
          onDraftLoaded: (value) => loadedValues.push(value),
        }),
      {
        initialProps: {
          data: { items: [] },
          scopeKey: "request:v2:A",
        },
      },
    );

    await waitFor(() => {
      expect(result.current.readyScopeKey).toBe("request:v2:A");
      expect(loadedValues).toEqual([loadedDraft]);
    });

    let deletePromise;
    await act(async () => {
      deletePromise = result.current.deleteDraftNow();
      await Promise.resolve();
    });
    expect(deleteFormDraftApi).toHaveBeenCalledWith(
      "create-quote",
      "request:v2:A",
    );

    rerender({ data: { items: [] }, scopeKey: "request:v2:B" });
    rerender({ data: { items: [] }, scopeKey: "request:v2:A" });

    expect(
      getFormDraftApi.mock.calls.filter(([, scope]) => scope === "request:v2:A"),
    ).toHaveLength(1);

    await act(async () => {
      deleteDeferred.resolve();
      await deletePromise;
    });

    await waitFor(() => {
      expect(result.current.readyScopeKey).toBe("request:v2:A");
      expect(
        getFormDraftApi.mock.calls.filter(
          ([, scope]) => scope === "request:v2:A",
        ),
      ).toHaveLength(2);
    });
    expect(loadedValues).toEqual([loadedDraft]);

    rerender({
      data: { items: [{ id: "future-item" }] },
      scopeKey: "request:v2:A",
    });

    await waitFor(() => {
      expect(upsertFormDraftApi).toHaveBeenCalledWith({
        form_key: "create-quote",
        scope_key: "request:v2:A",
        data: { items: [{ id: "future-item" }] },
      });
    });
  });

  it("rolls back existence metadata after a failed upsert", async () => {
    upsertFormDraftApi.mockRejectedValueOnce(new Error("upsert failed"));

    const { result, rerender } = renderHook(
      ({ data }) =>
        usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey: "request:v2:failed-upsert",
          data,
          debounceMs: 0,
          isMeaningfulDraft: (value) => Boolean(value.items?.length),
        }),
      {
        initialProps: {
          data: { items: [] },
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
    });

    rerender({ data: { items: [{ id: "failed-item" }] } });

    await waitFor(() => {
      expect(upsertFormDraftApi).toHaveBeenCalledTimes(1);
      expect(result.current.isSavingDraft).toBe(false);
    });

    rerender({ data: { items: [] } });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(deleteFormDraftApi).not.toHaveBeenCalled();

    rerender({ data: { items: [{ id: "retry-item" }] } });
    await waitFor(() => {
      expect(upsertFormDraftApi).toHaveBeenCalledTimes(2);
      expect(upsertFormDraftApi).toHaveBeenLastCalledWith({
        form_key: "create-quote",
        scope_key: "request:v2:failed-upsert",
        data: { items: [{ id: "retry-item" }] },
      });
    });
  });

  it("does not delete a loaded meaningful draft before its parent applies it", async () => {
    const loadedDraft = { items: [{ id: "loaded-item" }] };
    let pendingLoadedDraft = null;
    getFormDraftApi.mockResolvedValue({
      data_json: JSON.stringify(loadedDraft),
    });

    const { result } = renderHook(() => {
      const [data, setData] = useState({ items: [] });
      const draft = usePersistedFormDraft({
        formKey: "create-quote",
        scopeKey: "request:v2:77",
        data,
        debounceMs: 0,
        isMeaningfulDraft: (value) => Boolean(value.items?.length),
        onDraftLoaded: (value) => {
          pendingLoadedDraft = value;
        },
      });

      return { ...draft, data, setData };
    });

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
      expect(pendingLoadedDraft).toEqual(loadedDraft);
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(deleteFormDraftApi).not.toHaveBeenCalled();

    act(() => {
      result.current.setData(pendingLoadedDraft);
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(deleteFormDraftApi).not.toHaveBeenCalled();
  });

  it("keeps an explicit deletion after unmount", async () => {
    const loadedDraft = { items: [{ id: "loaded-item" }] };
    getFormDraftApi.mockResolvedValue({
      data_json: JSON.stringify(loadedDraft),
    });

    const { result, unmount } = renderHook(() => {
      const [data, setData] = useState({ items: [] });
      const draft = usePersistedFormDraft({
        formKey: "create-quote",
        scopeKey: "request:v2:88",
        data,
        debounceMs: 10_000,
        isMeaningfulDraft: (value) => Boolean(value.items?.length),
        onDraftLoaded: setData,
      });

      return { ...draft, data, setData };
    });

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
      expect(result.current.data).toEqual(loadedDraft);
    });

    let deletePromise;
    await act(async () => {
      deletePromise = result.current.deleteDraftNow();
      await Promise.resolve();
    });
    unmount();

    await act(async () => {
      await deletePromise;
    });
    expect(deleteFormDraftApi).toHaveBeenCalledTimes(1);
    expect(deleteFormDraftApi).toHaveBeenCalledWith(
      "create-quote",
      "request:v2:88",
    );
  });

  it("keeps an explicit deletion across a scope transition", async () => {
    const loadedDraft = { items: [{ id: "loaded-item" }] };
    getFormDraftApi.mockImplementation((formKey, scopeKey) =>
      Promise.resolve(
        scopeKey === "request:v2:91"
          ? { data_json: JSON.stringify(loadedDraft) }
          : null,
      ),
    );

    const { result, rerender } = renderHook(
      ({ scopeKey }) => {
        const [data, setData] = useState({ items: [] });
        const draft = usePersistedFormDraft({
          formKey: "create-quote",
          scopeKey,
          data,
          debounceMs: 10_000,
          isMeaningfulDraft: (value) => Boolean(value.items?.length),
          onDraftLoaded: setData,
        });

        return { ...draft, data, setData };
      },
      { initialProps: { scopeKey: "request:v2:91" } },
    );

    await waitFor(() => {
      expect(result.current.isDraftReady).toBe(true);
      expect(result.current.data).toEqual(loadedDraft);
    });

    let deletePromise;
    await act(async () => {
      deletePromise = result.current.deleteDraftNow();
      await Promise.resolve();
    });
    rerender({ scopeKey: "request:v2:92" });

    await act(async () => {
      await deletePromise;
    });
    await waitFor(() => {
      expect(result.current.readyScopeKey).toBe("request:v2:92");
      expect(deleteFormDraftApi).toHaveBeenCalledTimes(1);
      expect(deleteFormDraftApi).toHaveBeenCalledWith(
        "create-quote",
        "request:v2:91",
      );
    });
  });
});
