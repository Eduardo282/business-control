import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteClientApi,
  getClientApi,
  listClientsDynamicApi,
  updateClientDynamicApi,
} from "../../../actionsAPI/clients.api";
import { listContactsDynamicByClientApi } from "../../../actionsAPI/contacts.api";
import { listProductsApi } from "../../../actionsAPI/products.api";
import { logger } from "../../../services/logger";
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
  const [client, setClient] = useState(null);
  const [clientDynamicColumns, setClientDynamicColumns] = useState([]);
  const [contactRows, setContactRows] = useState([]);
  const [contactDynamicColumns, setContactDynamicColumns] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);

  const clientPreferences = useExcelViewPreferences(EXCEL_VIEW_STORAGE_KEY);
  const contactPreferences = useExcelViewPreferences(
    CONTACTS_EXCEL_VIEW_STORAGE_KEY,
  );

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [clientData, dynamicData, contactsDynamicData] = await Promise.all([
        getClientApi(clientId),
        listClientsDynamicApi().catch(() => null),
        listContactsDynamicByClientApi(clientId).catch(() => null),
      ]);

      const dynamicColumns = dynamicData?.columns || [];
      const dynamicRows = dynamicData?.rows || [];
      const dynamicClientRow = dynamicRows.find(
        (row) =>
          String(row?.id) === String(clientData?.id ?? clientId),
      );
      const mergedClient =
        dynamicClientRow
          ? {
              ...clientData,
              ...dynamicClientRow,
              id: clientData?.id ?? dynamicClientRow?.id,
            }
          : clientData;

      const graphQlContacts = Array.isArray(clientData?.contacts)
        ? clientData.contacts
        : [];
      const dynamicContactRows = Array.isArray(contactsDynamicData?.rows)
        ? contactsDynamicData.rows
        : [];
      const dynamicContactColumns = Array.isArray(contactsDynamicData?.columns)
        ? contactsDynamicData.columns
        : [];
      const fallbackRows = dynamicContactRows.length
        ? dynamicContactRows
        : graphQlContacts;
      const graphQlContactsById = new Map(
        graphQlContacts.map((contact) => [String(contact.id), contact]),
      );
      const mergedContactRows = fallbackRows.map((row) => ({
        ...(graphQlContactsById.get(String(row?.id)) || {}),
        ...row,
      }));
      const nextContactColumns = dynamicContactColumns.length
        ? dynamicContactColumns
        : CONTACT_FALLBACK_COLUMNS;

      setClient(mergedClient);
      setClientDynamicColumns(dynamicColumns);
      setContactRows(mergedContactRows);
      setContactDynamicColumns(nextContactColumns);

      const dynamicFormValues = dynamicColumns
        .filter(
          (column) => !CLIENT_DETAIL_HIDDEN_FIELDS.has(column?.name),
        )
        .reduce((values, column) => {
          const rawValue = mergedClient?.[column.name];
          values[column.name] =
            rawValue === null || rawValue === undefined
              ? ""
              : String(rawValue);
          return values;
        }, {});

      setClientForm(
        Object.keys(dynamicFormValues).length
          ? dynamicFormValues
          : getFallbackClientForm(mergedClient),
      );

      listProductsApi(clientId)
        .then((products) => {
          setProductsList(
            products.filter((product) => product.client_id == clientId),
          );
        })
        .catch((loadError) =>
          logger.error("Error loading client products", loadError),
        );
    } catch (loadError) {
      setError(loadError.message || "Error cargando cliente");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleUpdateClient = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        const payload = { ...clientForm };

        if (Object.prototype.hasOwnProperty.call(payload, "rfc")) {
          payload.rfc = client?.rfc ?? payload.rfc;
        }

        await updateClientDynamicApi(clientId, payload);
        setIsEditingClient(false);
        await load();
        notificationService.success(
          "¡Cliente actualizado!",
          "Los datos del cliente se guardaron correctamente.",
        );
      } catch (updateError) {
        notificationService.error("Error al actualizar", updateError.message);
      }
    },
    [client, clientForm, clientId, load],
  );

  const handleDeleteClient = useCallback(async () => {
    const contactCount = contactRows.length || 0;
    const text =
      contactCount > 0
        ? `Este cliente tiene ${contactCount} contacto(s) asociado(s). Se eliminará "${client.business_name}" y todos sus datos.`
        : `Se eliminará el cliente "${client.business_name}".`;
    const confirm = await notificationService.confirm({
      title: "¿Estás seguro?",
      text,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm) return;

    try {
      await deleteClientApi(clientId);
      notificationService.toast({
        title: "Cliente eliminado correctamente",
        icon: "success",
      });
      navigate("/clientes");
    } catch (deleteError) {
      notificationService.error("Error", deleteError.message);
    }
  }, [client, clientId, contactRows.length, navigate]);

  return {
    client,
    contactRows,
    contactDynamicColumns,
    productsList,
    loading,
    error,
    load,
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
