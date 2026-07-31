import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  deletePortalContactProductApi,
  listPortalQuotesApi,
} from "../../../actionsAPI/portal.api";
import { logger } from "../../../services/logger";
import { notificationService } from "../../../services/notificationService";
import { fmtDate, getProductTypeLabel, groupServicesByName } from "./portalDashboardHelpers";

export default function usePortalDashboardController() {
  const { contact, setContact } = useOutletContext();
  const [services, setServices] = useState(contact?.active_services || []);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [page, setPage] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [jumpInput, setJumpInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [selectedServiceByGroup, setSelectedServiceByGroup] = useState({});
  const [activeFolioGroup, setActiveFolioGroup] = useState(null);

  useEffect(() => {
    setServices(contact?.active_services || []);
  }, [contact?.active_services]);

  const loadQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const q = await listPortalQuotesApi();
      setQuotes(q || []);
    } catch (e) {
      logger.error("Error loading portal quotes in dashboard", e);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handlePullReel = useCallback(() => {
    if (pulling) return;
    setPulling(true);
    setSpinKey((prev) => prev + 1);
    setTimeout(() => setPulling(false), 950);
  }, [pulling]);

  const handleDeleteService = useCallback(async (serviceId) => {
    const confirmed = await notificationService.confirm({
      title: "¿Quitar producto o servicio?",
      text: "Esta acción lo eliminará de tus servicios activos en el portal.",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    setDeletingServiceId(serviceId);
    try {
      const resp = await deletePortalContactProductApi(serviceId);

      setServices((prev) =>
        prev.filter((svc) => String(svc.id) !== String(serviceId)),
      );

      if (resp?.updated_contact && setContact) {
        setContact((prev) => ({
          ...prev,
          ...resp.updated_contact,
        }));
      }

      notificationService.toast({
        title: "Producto o servicio removido",
        icon: "success",
      });
    } catch (e) {
      notificationService.error(
        "Error",
        e.message || "No se pudo quitar el producto o servicio.",
      );
    } finally {
      setDeletingServiceId(null);
    }
  }, [setContact]);

  const groupedServices = useMemo(
    () => groupServicesByName(services, selectedServiceByGroup),
    [services, selectedServiceByGroup],
  );

  const filteredServices = useMemo(() => {
    return groupedServices.filter((service) => {
      if (statusFilter !== "ALL" && service.status !== statusFilter)
        return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        service.product?.name?.toLowerCase().includes(term) ||
        service.product?.description?.toLowerCase().includes(term) ||
        getProductTypeLabel(service).toLowerCase().includes(term) ||
        service.license_key?.toLowerCase().includes(term) ||
        service.status?.toLowerCase().includes(term) ||
        fmtDate(service.start_date).includes(term) ||
        fmtDate(service.expiration_date).includes(term)
      );
    });
  }, [groupedServices, searchTerm, statusFilter]);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const currentServices = filteredServices.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const pendingQuotesCount = useMemo(
    () =>
      quotes.filter((q) => ["PENDIENTE", "ENVIADA"].includes(q.status)).length,
    [quotes],
  );

  const handleSelectGroupService = useCallback((groupKey, service) => {
    setSelectedServiceByGroup((prev) => ({
      ...prev,
      [groupKey]: service.id,
    }));
    setActiveFolioGroup(null);
  }, []);

  return {
    activeFolioGroup,
    contact,
    currentServices,
    deletingServiceId,
    filteredServices,
    groupedServices,
    handleDeleteService,
    handlePullReel,
    handleSelectGroupService,
    jumpInput,
    loadingQuotes,
    page,
    PAGE_SIZE,
    pendingQuotesCount,
    pulling,
    quotes,
    searchTerm,
    selectedServiceByGroup,
    services,
    setActiveFolioGroup,
    setJumpInput,
    setPage,
    setSearchTerm,
    setSelectedServiceByGroup,
    setSpinKey,
    setStatusFilter,
    spinKey,
    statusFilter,
    totalPages,
  };
}
