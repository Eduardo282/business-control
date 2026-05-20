import { useState } from "react";

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function usePolicyDates(selectedFoliosByGroup) {
  const [editingRow, setEditingRow] = useState(null);

  const startEditRow = (group) => {
    const selectedId = selectedFoliosByGroup[group.id];
    let selectedItem = group.items?.find(
      (item) => String(item.id) === String(selectedId),
    );
    if (!selectedItem && group.items?.length > 0) {
      selectedItem = group.items[0];
    }

    if (selectedItem) {
      setEditingRow({
        id: group.id,
        group,
        policyIds: [selectedItem.id],
        start_date: toInputDate(selectedItem.start_date),
        expiration_date: toInputDate(selectedItem.expiration_date),
        status: selectedItem.status || "ACTIVE",
        selectedFolioId: String(selectedItem.id),
        license_key: selectedItem.license_key || "",
      });
      return;
    }

    const sd = toInputDate(group.start_date);
    const ed = toInputDate(group.expiration_date);
    setEditingRow({
      id: group.id,
      group,
      policyIds: group.policyIds || [],
      start_date: sd,
      expiration_date: ed,
      status: group.status || "ACTIVE",
      selectedFolioId: "ALL",
      license_key: "",
    });
  };

  return {
    editingRow,
    setEditingRow,
    startEditRow,
  };
}
