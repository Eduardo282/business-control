import { useState } from "react";
import { notificationService } from "../../../../services/notificationService";

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function usePolicyAssignment() {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignFormInitial, setAssignFormInitial] = useState(null);

  const openAssignModal = (group) => {
    if (!group?.product?.id) {
      notificationService.error("Error", "No hay producto para asignar.");
      return;
    }

    const clientId = group.client?.id ? String(group.client.id) : "";
    const startDate = toInputDate(group.start_date) || new Date().toISOString().slice(0, 10);
    const expDate = toInputDate(group.expiration_date);

    setAssignTarget(group);
    setAssignFormInitial({
      client_id: clientId,
      contact_id: "",
      license_key: "",
      start_date: startDate,
      expiration_date: expDate,
      status: group.status || "ACTIVE",
    });
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignTarget(null);
    setAssignFormInitial(null);
  };

  return {
    assignModalOpen,
    setAssignModalOpen,
    assignTarget,
    setAssignTarget,
    assignFormInitial,
    setAssignFormInitial,
    openAssignModal,
    closeAssignModal,
  };
}
