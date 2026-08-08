import { useCallback, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  createContactApi,
  deleteContactApi,
  updateContactDynamicApi,
} from "../../../actionsAPI/contacts.api";
import { notificationService } from "../../../services/notificationService";
import {
  CONTACT_FALLBACK_COLUMNS,
  CONTACT_READONLY_FIELDS,
  CONTACT_TABLE_HEADER_HEIGHT,
  CONTACT_TABLE_ROW_HEIGHT,
  CONTACTS_EXCEL_VIEW_STORAGE_KEY,
  INITIAL_CONTACT_FORM,
} from "./clientDetailConstants";
import {
  getContactColumnsFromView,
  getContactDetailColumns,
  getContactEditableColumns,
  getContactPrimaryColumns,
  getDisabledContacts,
} from "./clientDetailHelpers";
import { useContactBulkImport } from "./useContactBulkImport";
import { useContactExport } from "./useContactExport";
import { useContactFilters } from "./useContactFilters";
import { useContactTableColumns } from "./useContactTableColumns";

export function useContactsController({
  clientId,
  contactRows,
  contactDynamicColumns,
  contactExcelViewColumns,
  setContactExcelViewColumns,
  contactColumnLabelOverrides,
  setContactColumnLabelOverrides,
  load,
}) {
  const [newContact, setNewContact] = useState(INITIAL_CONTACT_FORM);
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactForm, setContactForm] = useState({});
  const [managingPortalContact, setManagingPortalContact] = useState(null);
  const [contactsSorting, setContactsSorting] = useState([]);
  const [expandedContactRows, setExpandedContactRows] = useState({});
  const [showDisabled, setShowDisabled] = useState(false);

  const contactColumnsFromView = useMemo(
    () =>
      getContactColumnsFromView(
        contactDynamicColumns,
        contactExcelViewColumns,
        contactColumnLabelOverrides,
      ),
    [
      contactDynamicColumns,
      contactExcelViewColumns,
      contactColumnLabelOverrides,
    ],
  );
  const contactPrimaryColumns = useMemo(
    () => getContactPrimaryColumns(contactColumnsFromView),
    [contactColumnsFromView],
  );
  const contactDetailColumns = useMemo(
    () =>
      getContactDetailColumns(
        contactColumnsFromView,
        contactPrimaryColumns,
      ),
    [contactColumnsFromView, contactPrimaryColumns],
  );
  const contactEditableColumns = useMemo(
    () => getContactEditableColumns(contactColumnsFromView),
    [contactColumnsFromView],
  );

  const addContact = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await createContactApi({ ...newContact, client_id: clientId });
        setNewContact(INITIAL_CONTACT_FORM);
        load();
        notificationService.toast({
          title: "Contacto agregado",
          icon: "success",
        });
      } catch (createError) {
        notificationService.error("Error", createError.message);
      }
    },
    [clientId, load, newContact],
  );

  const startEditContact = useCallback(
    (contact) => {
      const editableFields = contactEditableColumns.length
        ? contactEditableColumns
        : CONTACT_FALLBACK_COLUMNS.filter(
            (column) => !CONTACT_READONLY_FIELDS.has(column.name),
          );
      const formValues = editableFields.reduce((values, column) => {
        const rawValue = contact?.[column.name];
        values[column.name] =
          rawValue === null || rawValue === undefined
            ? ""
            : String(rawValue);
        return values;
      }, {});

      setEditingContactId(contact.id);
      setContactForm(formValues);
    },
    [contactEditableColumns],
  );

  const handleUpdateContact = useCallback(async () => {
    try {
      await updateContactDynamicApi(editingContactId, contactForm);
      setEditingContactId(null);
      load();
      notificationService.success(
        "¡Contacto actualizado!",
        "Los cambios se aplicaron correctamente.",
      );
    } catch (updateError) {
      notificationService.error("Error", updateError.message);
    }
  }, [contactForm, editingContactId, load]);

  const handleDeleteContact = useCallback(
    async (contactId) => {
      const confirm = await notificationService.confirm({
        title: "¿Deshabilitar contacto?",
        text: "El contacto dejará de ser accesible.",
        confirmButtonText: "Sí, deshabilitar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm) return;

      try {
        await deleteContactApi(contactId);
        await load();
        setShowDisabled(true);
        notificationService.toast({
          title: "Contacto deshabilitado",
          icon: "success",
        });
      } catch (deleteError) {
        notificationService.error("Error", deleteError.message);
      }
    },
    [load],
  );

  const filters = useContactFilters({
    contactRows,
    contactColumnsFromView,
  });
  const { contactsColumns, disabledContactsColumns } =
    useContactTableColumns({
      contactPrimaryColumns,
      contactDetailColumns,
      expandedContactRows,
      setExpandedContactRows,
      setManagingPortalContact,
      startEditContact,
      handleDeleteContact,
    });

  const disabledContacts = useMemo(
    () => getDisabledContacts(contactRows),
    [contactRows],
  );
  const disabledContactsTable = useReactTable({
    data: disabledContacts,
    columns: disabledContactsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 3 },
    },
  });
  const contactsTable = useReactTable({
    data: filters.filteredContacts,
    columns: contactsColumns,
    state: { sorting: contactsSorting },
    onSortingChange: setContactsSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const contactsPageSize = contactsTable.getState().pagination.pageSize;
  const contactTableMinHeight =
    CONTACT_TABLE_HEADER_HEIGHT +
    contactsPageSize * CONTACT_TABLE_ROW_HEIGHT;
  const contactExport = useContactExport({
    contactColumnsFromView,
    contactsTable,
  });
  const bulkImport = useContactBulkImport({
    clientId,
    onImported: load,
    contactsExcelViewStorageKey: CONTACTS_EXCEL_VIEW_STORAGE_KEY,
    onDriveMapping: ({
      columnLabelOverrides,
      excelViewColumns,
    }) => {
      setContactColumnLabelOverrides(columnLabelOverrides);
      setContactExcelViewColumns(excelViewColumns);
    },
  });

  return {
    contactRows,
    newContact,
    setNewContact,
    editingContactId,
    setEditingContactId,
    contactForm,
    setContactForm,
    managingPortalContact,
    setManagingPortalContact,
    expandedContactRows,
    showDisabled,
    setShowDisabled,
    contactColumnsFromView,
    contactPrimaryColumns,
    contactDetailColumns,
    contactEditableColumns,
    disabledContacts,
    disabledContactsTable,
    visibleDisabledContactRows:
      disabledContactsTable.getRowModel().rows,
    shouldEnableDisabledContactsTableScroll:
      disabledContacts.length > 3,
    contactsTable,
    visibleContactRows: contactsTable.getRowModel().rows,
    shouldEnableContactTableScroll: contactsPageSize >= 25,
    contactTableMinHeight,
    addContact,
    handleUpdateContact,
    ...filters,
    ...contactExport,
    ...bulkImport,
  };
}
