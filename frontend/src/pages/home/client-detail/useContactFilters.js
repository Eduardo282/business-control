import { useCallback, useEffect, useMemo, useState } from "react";
import { INITIAL_CONTACT_FILTERS } from "./clientDetailConstants";
import {
  filterContacts,
  getContactFilterOptions,
  getContactQuickFilterButtons,
} from "./clientDetailHelpers";
import { normalizeSearchText } from "./utils";

export function useContactFilters({ contactRows, contactColumnsFromView }) {
  const [contactSearch, setContactSearch] = useState("");
  const [showContactFilters, setShowContactFilters] = useState(false);
  const [contactFilters, setContactFilters] = useState(
    INITIAL_CONTACT_FILTERS,
  );
  const [
    activeContactFilterPickerField,
    setActiveContactFilterPickerField,
  ] = useState(null);
  const [contactFilterPickerSearch, setContactFilterPickerSearch] =
    useState("");
  const [contactFilterPickerPage, setContactFilterPickerPage] = useState(0);

  const contactQuickFilterButtons = useMemo(
    () => getContactQuickFilterButtons(contactColumnsFromView),
    [contactColumnsFromView],
  );

  const activeContactFilterPickerConfig = useMemo(
    () =>
      contactQuickFilterButtons.find(
        (button) =>
          button.fieldName === activeContactFilterPickerField,
      ) || null,
    [contactQuickFilterButtons, activeContactFilterPickerField],
  );

  const contactFilterPickerOptions = useMemo(
    () =>
      getContactFilterOptions(
        contactRows,
        activeContactFilterPickerField,
      ),
    [contactRows, activeContactFilterPickerField],
  );

  const visibleContactFilterPickerOptions = useMemo(() => {
    const normalizedPickerSearch = normalizeSearchText(
      contactFilterPickerSearch,
    );
    if (!normalizedPickerSearch) return contactFilterPickerOptions;

    return contactFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(normalizedPickerSearch),
    );
  }, [contactFilterPickerSearch, contactFilterPickerOptions]);

  useEffect(() => {
    if (!showContactFilters) {
      setActiveContactFilterPickerField(null);
      setContactFilterPickerSearch("");
      setContactFilterPickerPage(0);
    }
  }, [showContactFilters]);

  const filteredContacts = useMemo(
    () =>
      filterContacts(
        contactRows,
        contactSearch,
        contactFilters,
        contactColumnsFromView,
      ),
    [
      contactRows,
      contactSearch,
      contactFilters,
      contactColumnsFromView,
    ],
  );

  const activeContactFilterCount =
    Object.values(contactFilters).filter((value) => value.trim() !== "")
      .length + (contactSearch.trim() ? 1 : 0);

  const clearContactFilters = useCallback(() => {
    setContactSearch("");
    setContactFilters(INITIAL_CONTACT_FILTERS);
    setActiveContactFilterPickerField(null);
    setContactFilterPickerSearch("");
    setContactFilterPickerPage(0);
  }, []);

  const openContactFilterPicker = useCallback((fieldName) => {
    setActiveContactFilterPickerField(fieldName);
    setContactFilterPickerSearch("");
    setContactFilterPickerPage(0);
  }, []);

  const closeContactFilterPicker = useCallback(() => {
    setActiveContactFilterPickerField(null);
    setContactFilterPickerSearch("");
    setContactFilterPickerPage(0);
  }, []);

  const applyContactFilterValue = useCallback(
    (fieldOrValue, optionalValue) => {
      if (optionalValue !== undefined) {
        setContactFilters((currentFilters) => ({
          ...currentFilters,
          [fieldOrValue]: optionalValue,
        }));
        if (activeContactFilterPickerField === fieldOrValue) {
          closeContactFilterPicker();
        }
        return;
      }

      if (!activeContactFilterPickerField) return;

      setContactFilters((currentFilters) => ({
        ...currentFilters,
        [activeContactFilterPickerField]: fieldOrValue,
      }));
      closeContactFilterPicker();
    },
    [activeContactFilterPickerField, closeContactFilterPicker],
  );

  return {
    contactSearch,
    setContactSearch,
    showContactFilters,
    setShowContactFilters,
    contactFilters,
    contactQuickFilterButtons,
    activeContactFilterPickerField,
    activeContactFilterPickerConfig,
    contactFilterPickerSearch,
    setContactFilterPickerSearch,
    contactFilterPickerPage,
    setContactFilterPickerPage,
    visibleContactFilterPickerOptions,
    filteredContacts,
    activeContactFilterCount,
    clearContactFilters,
    openContactFilterPicker,
    closeContactFilterPicker,
    applyContactFilterValue,
  };
}
