import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteFormDraftApi,
  getFormDraftApi,
  upsertFormDraftApi,
} from "../actionsAPI/formDrafts.api";
import { logger } from "../services/logger";

function safeParseDraftData(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createDraftStatus() {
  return {
    lastSavedPayload: "",
    knownToExist: false,
    pendingUpsertCount: 0,
    deleteQueued: false,
    deletePromise: null,
    awaitingLoadedMeaningfulData: false,
  };
}

export function usePersistedFormDraft({
  formKey,
  scopeKey = "global",
  data,
  enabled = true,
  loadEnabled = true,
  saveEnabled = true,
  debounceMs = 800,
  isMeaningfulDraft = () => true,
  onDraftLoaded,
}) {
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [readyScopeKey, setReadyScopeKey] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const onDraftLoadedRef = useRef(onDraftLoaded);
  const shouldPersistRef = useRef(isMeaningfulDraft);
  const didLoadRef = useRef(false);
  const draftStatusesRef = useRef(new Map());
  const saveTimerRef = useRef(null);
  const operationQueueRef = useRef(Promise.resolve());
  const pendingOperationCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const draftScopeKey = `${formKey || ""}\u0000${scopeKey}`;

  const getDraftStatus = useCallback(() => {
    let status = draftStatusesRef.current.get(draftScopeKey);
    if (!status) {
      status = createDraftStatus();
      draftStatusesRef.current.set(draftScopeKey, status);
    }
    return status;
  }, [draftScopeKey]);

  const cancelScheduledPersist = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const enqueueDraftOperation = useCallback((operation) => {
    pendingOperationCountRef.current += 1;
    setIsSavingDraft(true);

    const queuedOperation = operationQueueRef.current
      .catch(() => undefined)
      .then(operation);
    operationQueueRef.current = queuedOperation.catch(() => undefined);

    return queuedOperation.finally(() => {
      pendingOperationCountRef.current -= 1;
      if (
        pendingOperationCountRef.current === 0 &&
        isMountedRef.current
      ) {
        setIsSavingDraft(false);
      }
    });
  }, []);

  const queueDraftDelete = useCallback((onlyIfKnown = false) => {
    cancelScheduledPersist();
    if (!formKey) return Promise.resolve();

    const status = getDraftStatus();
    if (
      onlyIfKnown &&
      !status.knownToExist &&
      status.pendingUpsertCount === 0
    ) {
      return Promise.resolve();
    }
    if (status.deleteQueued) return status.deletePromise;

    status.deleteQueued = true;
    status.deletePromise = enqueueDraftOperation(async () => {
      await deleteFormDraftApi(formKey, scopeKey);
      status.lastSavedPayload = "";
      status.knownToExist = false;
      status.awaitingLoadedMeaningfulData = false;
    }).finally(() => {
      status.deleteQueued = false;
      status.deletePromise = null;
    });

    return status.deletePromise;
  }, [
    cancelScheduledPersist,
    enqueueDraftOperation,
    formKey,
    getDraftStatus,
    scopeKey,
  ]);

  const queueDraftUpsert = useCallback(
    (payload, serializedPayload) => {
      const status = getDraftStatus();
      status.pendingUpsertCount += 1;
      status.awaitingLoadedMeaningfulData = false;

      return enqueueDraftOperation(async () => {
        await upsertFormDraftApi({
          form_key: formKey,
          scope_key: scopeKey,
          data: payload,
        });
        status.lastSavedPayload = serializedPayload;
        status.knownToExist = true;
      }).finally(() => {
        status.pendingUpsertCount -= 1;
      });
    },
    [enqueueDraftOperation, formKey, getDraftStatus, scopeKey],
  );

  const persistDraftNow = useCallback(
    (nextData) => {
      cancelScheduledPersist();
      if (!formKey) return Promise.resolve();

      const payload = safeParseDraftData(nextData) || {};
      if (!shouldPersistRef.current(payload)) {
        return queueDraftDelete();
      }

      const serializedPayload = JSON.stringify(payload);
      return queueDraftUpsert(payload, serializedPayload);
    },
    [
      cancelScheduledPersist,
      formKey,
      queueDraftUpsert,
      queueDraftDelete,
    ],
  );

  const deleteDraftNow = useCallback(
    () => queueDraftDelete(),
    [queueDraftDelete],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cancelScheduledPersist();
    };
  }, [cancelScheduledPersist]);

  useEffect(() => {
    onDraftLoadedRef.current = onDraftLoaded;
  }, [onDraftLoaded]);

  useEffect(() => {
    shouldPersistRef.current = isMeaningfulDraft;
  }, [isMeaningfulDraft]);

  useEffect(() => {
    let cancelled = false;
    const status = getDraftStatus();
    didLoadRef.current = false;
    setIsDraftReady(false);
    setReadyScopeKey("");

    if (!enabled || !loadEnabled || !formKey) {
      didLoadRef.current = true;
      setIsDraftReady(true);
      setReadyScopeKey(scopeKey);
      return () => {
        cancelled = true;
      };
    }

    async function loadDraft() {
      try {
        await operationQueueRef.current.catch(() => undefined);
        if (cancelled) return;

        const draft = await getFormDraftApi(formKey, scopeKey);
        if (cancelled) return;

        const parsedData = safeParseDraftData(draft?.data_json);
        status.knownToExist = Boolean(draft);
        if (!draft) {
          status.lastSavedPayload = "";
          status.awaitingLoadedMeaningfulData = false;
        }
        if (parsedData) {
          status.lastSavedPayload = JSON.stringify(parsedData);
          status.awaitingLoadedMeaningfulData =
            shouldPersistRef.current(parsedData);
          onDraftLoadedRef.current?.(parsedData, draft);
        }
      } catch (error) {
        logger.warn("Could not load form draft", error);
      } finally {
        if (!cancelled) {
          didLoadRef.current = true;
          setIsDraftReady(true);
          setReadyScopeKey(scopeKey);
        }
      }
    }

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [
    draftScopeKey,
    enabled,
    formKey,
    getDraftStatus,
    loadEnabled,
    scopeKey,
  ]);

  const serializedData = useMemo(() => JSON.stringify(data || {}), [data]);

  useEffect(() => {
    if (
      !enabled ||
      !saveEnabled ||
      !formKey ||
      !didLoadRef.current
    ) {
      return undefined;
    }

    const payload = safeParseDraftData(serializedData) || {};
    const shouldPersist = shouldPersistRef.current(payload);
    const status = getDraftStatus();

    if (status.awaitingLoadedMeaningfulData) {
      if (!shouldPersist) return undefined;
      status.awaitingLoadedMeaningfulData = false;
    }

    if (!shouldPersist) {
      cancelScheduledPersist();
      if (
        (!status.knownToExist && status.pendingUpsertCount === 0) ||
        status.deleteQueued
      ) {
        return undefined;
      }

      queueDraftDelete(true).catch((error) => {
        logger.warn("Could not save form draft", error);
      });
      return undefined;
    }

    if (status.lastSavedPayload === serializedData) return undefined;

    const timer = setTimeout(() => {
      if (saveTimerRef.current === timer) {
        saveTimerRef.current = null;
      }

      queueDraftUpsert(payload, serializedData).catch((error) => {
        logger.warn("Could not save form draft", error);
      });
    }, debounceMs);
    saveTimerRef.current = timer;

    return () => {
      if (saveTimerRef.current === timer) {
        clearTimeout(timer);
        saveTimerRef.current = null;
      }
    };
  }, [
    cancelScheduledPersist,
    debounceMs,
    enabled,
    formKey,
    getDraftStatus,
    queueDraftUpsert,
    queueDraftDelete,
    readyScopeKey,
    saveEnabled,
    scopeKey,
    serializedData,
  ]);

  return {
    isDraftReady,
    readyScopeKey,
    isSavingDraft,
    persistDraftNow,
    deleteDraftNow,
  };
}
