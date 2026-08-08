import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteClientApi,
  getClientApi,
  listClientsDynamicApi,
  updateClientDynamicApi,
} from "../../../actionsAPI/clients.api";
import { listContactsDynamicByClientApi } from "../../../actionsAPI/contacts.api";
import { listProductsApi } from "../../../actionsAPI/products.api";
import { notificationService } from "../../../services/notificationService";
import {
  CLIENT_DETAIL_HIDDEN_FIELDS,
  CONTACT_FALLBACK_COLUMNS,
  CONTACTS_EXCEL_VIEW_STORAGE_KEY,
  EXCEL_VIEW_STORAGE_KEY,
  INITIAL_CLIENT_FORM,
} from "./clientDetailConstants";
import {
  getClientGeneralColumns,
  getClientGeneralFields,
  getOrphanClientGeneralFieldName,
} from "./clientDetailHelpers";

function getFallbackClientForm(client) {
  return {
    business_name: client.business_name,
    rfc: client.rfc || "",
    email1: client.email1 || "",
    email2: client.email2 || "",
    celular: client.celular || "",
    telefono: client.telefono || "",
    codigo_postal: client.codigo_postal || "",
    ciudad: client.ciudad || "",
  };
}

function useExcelViewPreferences(storageKey) {
  const [excelViewColumns, setExcelViewColumns] = useState(null);
  const [columnLabelOverrides, setColumnLabelOverrides] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed?.columnLabelOverrides) {
        setColumnLabelOverrides(parsed.columnLabelOverrides);
      }
      if (Array.isArray(parsed?.excelViewColumns)) {
        setExcelViewColumns(parsed.excelViewColumns);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    excelViewColumns,
    setExcelViewColumns,
    columnLabelOverrides,
    setColumnLabelOverrides,
  };
}

export function useClientRecord({ clientId, navigate }) {
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);
  const queryClient = useQueryClient();

  const clientPreferences = useExcelViewPreferences(EXCEL_VIEW_STORAGE_KEY);
  const contactPreferences = useExcelViewPreferences(
    CONTACTS_EXCEL_VIEW_STORAGE_KEY,
  );

  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientApi(clientId),
  });

  const { data: dynamicData, isLoading: dynamicLoading } = useQuery({
    queryKey: ["clientsDynamic"],
    queryFn: listClientsDynamicApi,
    staleTime: 5 * 60 * 1000,
  });

  const { data: contactsDynamicData, isLoading: contactsDynamicLoading } = useQuery({
    queryKey: ["contactsDynamic", clientId],
    queryFn: () => listContactsDynamicByClientApi(clientId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: productsListData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", clientId],
    queryFn: () => listProductsApi(clientId),
    staleTime: 5 * 60 * 1000,
  });

  const loading = clientLoading || dynamicLoading || contactsDynamicLoading || productsLoading;
  const error = clientError ? (clientError.message || "Error cargando cliente") : "";

  const clientDynamicColumns = useMemo(() => dynamicData?.columns || [], [dynamicData?.columns]);
  const contactDynamicColumns = Array.isArray(contactsDynamicData?.columns) && contactsDynamicData.columns.length > 0 
    ? contactsDynamicData.columns 
    : CONTACT_FALLBACK_COLUMNS;
  const productsList = productsListData ? productsListData.filter(p => p.client_id == clientId) : [];

  const client = useMemo(() => {
    if (!clientData) return null;
    const dynamicRows = dynamicData?.rows || [];
    const dynamicClientRow = dynamicRows.find(
      (row) => String(row?.id) === String(clientData?.id ?? clientId),
    );
    return dynamicClientRow
      ? {
          ...clientData,
          ...dynamicClientRow,
          id: clientData?.id ?? dynamicClientRow?.id,
        }
      : clientData;
  }, [clientData, dynamicData, clientId]);

  const contactRows = useMemo(() => {
    if (!clientData) return [];
    const graphQlContacts = Array.isArray(clientData.contacts) ? clientData.contacts : [];
    const dynamicContactRows = Array.isArray(contactsDynamicData?.rows) ? contactsDynamicData.rows : [];
    
    const fallbackRows = dynamicContactRows.length ? dynamicContactRows : graphQlContacts;
    const graphQlContactsById = new Map(
      graphQlContacts.map((contact) => [String(contact.id), contact]),
    );
    
    return fallbackRows.map((row) => ({
      ...(graphQlContactsById.get(String(row?.id)) || {}),
      ...row,
    }));
  }, [clientData, contactsDynamicData]);

  useEffect(() => {
    if (!client || !clientDynamicColumns.length) return;
    const dynamicFormValues = clientDynamicColumns
      .filter((column) => !CLIENT_DETAIL_HIDDEN_FIELDS.has(column?.name))
      .reduce((values, column) => {
        const rawValue = client?.[column.name];
        values[column.name] = rawValue === null || rawValue === undefined ? "" : String(rawValue);
        return values;
      }, {});

    setClientForm(
      Object.keys(dynamicFormValues).length
        ? dynamicFormValues
        : getFallbackClientForm(client),
    );
  }, [client, clientDynamicColumns]);

  // Removing manual load useEffect since useQuery handles it

  const clientGeneralColumns = useMemo(
    () =>
      getClientGeneralColumns(
        clientDynamicColumns,
        clientPreferences.excelViewColumns,
      ),
    [clientDynamicColumns, clientPreferences.excelViewColumns],
  );

  const clientGeneralFields = useMemo(
    () =>
      getClientGeneralFields(
        client,
        clientGeneralColumns,
        clientPreferences.columnLabelOverrides,
      ),
    [
      client,
      clientGeneralColumns,
      clientPreferences.columnLabelOverrides,
    ],
  );

  const orphanClientGeneralFieldName = useMemo(
    () => getOrphanClientGeneralFieldName(clientGeneralFields),
    [clientGeneralFields],
  );

  const openEditClientModal = useCallback(() => {
    if (!client) return;

    const dynamicFormValues = clientGeneralFields.reduce((values, field) => {
      const rawValue = client[field.name];
      values[field.name] =
        rawValue === null || rawValue === undefined ? "" : String(rawValue);
      return values;
    }, {});

    if (Object.keys(dynamicFormValues).length) {
      setClientForm(dynamicFormValues);
    }

    setIsEditingClient(true);
  }, [client, clientGeneralFields]);

  const updateClientMutation = useMutation({
    mutationFn: async (payload) => {
      if (Object.prototype.hasOwnProperty.call(payload, "rfc")) {
        payload.rfc = client?.rfc ?? payload.rfc;
      }
      return updateClientDynamicApi(clientId, payload);
    },
    onSuccess: () => {
      setIsEditingClient(false);
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["clientsDynamic"]);
      notificationService.success(
        "¡Cliente actualizado!",
        "Los datos del cliente se guardaron correctamente.",
      );
    },
    onError: (updateError) => {
      notificationService.error("Error al actualizar", updateError.message);
    }
  });

  const handleUpdateClient = useCallback(
    (event) => {
      event.preventDefault();
      updateClientMutation.mutate({ ...clientForm });
    },
    [clientForm, updateClientMutation],
  );

  const deleteClientMutation = useMutation({
    mutationFn: () => deleteClientApi(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries(["clientsDynamic"]);
      notificationService.toast({
        title: "Cliente eliminado correctamente",
        icon: "success",
      });
      navigate("/clientes");
    },
    onError: (deleteError) => {
      notificationService.error("Error", deleteError.message);
    }
  });

  const handleDeleteClient = useCallback(async () => {
    const contactCount = contactRows.length || 0;
    const text =
      contactCount > 0
        ? `Se eliminará "${client.business_name}" y sus ${contactCount} contacto(s). Las cotizaciones y ventas asociadas se conservarán.`
        : `Se eliminará el cliente "${client.business_name}".`;
    const confirm = await notificationService.confirm({
      title: "¿Estás seguro?",
      text,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm) return;

    deleteClientMutation.mutate();
  }, [client, contactRows.length, deleteClientMutation]);

  return {
    client,
    contactRows,
    contactDynamicColumns,
    productsList,
    loading,
    error,
    load: () => {
      queryClient.invalidateQueries(["client", clientId]);
      queryClient.invalidateQueries(["clientsDynamic"]);
      queryClient.invalidateQueries(["contactsDynamic", clientId]);
      queryClient.invalidateQueries(["products", clientId]);
    },
    isEditingClient,
    setIsEditingClient,
    clientForm,
    setClientForm,
    clientGeneralFields,
    orphanClientGeneralFieldName,
    openEditClientModal,
    handleUpdateClient,
    handleDeleteClient,
    contactExcelViewColumns: contactPreferences.excelViewColumns,
    setContactExcelViewColumns: contactPreferences.setExcelViewColumns,
    contactColumnLabelOverrides: contactPreferences.columnLabelOverrides,
    setContactColumnLabelOverrides:
      contactPreferences.setColumnLabelOverrides,
  };
}
