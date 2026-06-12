import { useEffect, useMemo, useRef, useState } from "react";
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

export function usePersistedFormDraft({
  formKey,
  scopeKey = "global",
  data,
  enabled = true,
  debounceMs = 800,
  isMeaningfulDraft = () => true,
  onDraftLoaded,
}) {
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const onDraftLoadedRef = useRef(onDraftLoaded);
  const shouldPersistRef = useRef(isMeaningfulDraft);
  const didLoadRef = useRef(false);
  const lastSavedPayloadRef = useRef("");

  useEffect(() => {
    onDraftLoadedRef.current = onDraftLoaded;
  }, [onDraftLoaded]);

  useEffect(() => {
    shouldPersistRef.current = isMeaningfulDraft;
  }, [isMeaningfulDraft]);

  useEffect(() => {
    let cancelled = false;
    didLoadRef.current = false;
    setIsDraftReady(false);
    lastSavedPayloadRef.current = "";

    if (!enabled || !formKey) {
      didLoadRef.current = true;
      setIsDraftReady(true);
      return () => {
        cancelled = true;
      };
    }

    async function loadDraft() {
      try {
        const draft = await getFormDraftApi(formKey, scopeKey);
        if (cancelled) return;

        const parsedData = safeParseDraftData(draft?.data_json);
        if (parsedData) {
          onDraftLoadedRef.current?.(parsedData, draft);
          lastSavedPayloadRef.current = JSON.stringify(parsedData);
        }
      } catch (error) {
        logger.warn("Could not load form draft", error);
      } finally {
        if (!cancelled) {
          didLoadRef.current = true;
          setIsDraftReady(true);
        }
      }
    }

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [enabled, formKey, scopeKey]);

  const serializedData = useMemo(() => JSON.stringify(data || {}), [data]);

  useEffect(() => {
    if (!enabled || !formKey || !didLoadRef.current) return undefined;

    const payload = safeParseDraftData(serializedData) || {};
    const shouldPersist = shouldPersistRef.current(payload);

    const timer = setTimeout(async () => {
      try {
        setIsSavingDraft(true);

        if (!shouldPersist) {
          if (lastSavedPayloadRef.current) {
            await deleteFormDraftApi(formKey, scopeKey);
            lastSavedPayloadRef.current = "";
          }
          return;
        }

        if (lastSavedPayloadRef.current === serializedData) return;

        await upsertFormDraftApi({
          form_key: formKey,
          scope_key: scopeKey,
          data: payload,
        });
        lastSavedPayloadRef.current = serializedData;
      } catch (error) {
        logger.warn("Could not save form draft", error);
      } finally {
        setIsSavingDraft(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, enabled, formKey, scopeKey, serializedData]);

  return { isDraftReady, isSavingDraft };
}
