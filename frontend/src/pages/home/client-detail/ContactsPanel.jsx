import {
  ChevronRight,
  FileSpreadsheet,
  Lightbulb,
  X,
} from "@icons";
import Card from "../../../components/ui/Card";
import ContactFilterPicker from "./ContactFilterPicker";
import ContactPagination from "./ContactPagination";
import ContactTable from "./ContactTable";
import ContactsToolbar from "./ContactsToolbar";
import DisabledContactsTable from "./DisabledContactsTable";
import { normalizeSearchText } from "./utils";

export default function ContactsPanel({
  client,
  user,
  contacts,
}) {
  return (
    <Card className="h-full">
      <ContactsToolbar
        client={client}
        user={user}
        filteredContactCount={contacts.filteredContacts.length}
        openBulkContactModal={contacts.openBulkContactModal}
        contactSearch={contacts.contactSearch}
        setContactSearch={contacts.setContactSearch}
        handleExportContactsPDF={contacts.handleExportContactsPDF}
        handleExportContactsExcel={contacts.handleExportContactsExcel}
        showContactFilters={contacts.showContactFilters}
        setShowContactFilters={contacts.setShowContactFilters}
        activeContactFilterCount={contacts.activeContactFilterCount}
        clearContactFilters={contacts.clearContactFilters}
        contactsTable={contacts.contactsTable}
      />

      <ContactFilterPicker
        isOpen={
          !!contacts.activeContactFilterPickerField &&
          contacts.showContactFilters
        }
        onClose={contacts.closeContactFilterPicker}
        activeContactFilterPickerField={
          contacts.activeContactFilterPickerField
        }
        activeContactFilterPickerConfig={
          contacts.activeContactFilterPickerConfig
        }
        contactFilterPickerSearch={
          contacts.contactFilterPickerSearch
        }
        setContactFilterPickerSearch={
          contacts.setContactFilterPickerSearch
        }
        contactFilterPickerPage={contacts.contactFilterPickerPage}
        setContactFilterPickerPage={
          contacts.setContactFilterPickerPage
        }
        visibleContactFilterPickerOptions={
          contacts.visibleContactFilterPickerOptions
        }
        contactFilters={contacts.contactFilters}
        applyContactFilterValue={contacts.applyContactFilterValue}
        normalizeSearchText={normalizeSearchText}
      />

      <div className="px-4 py-2 min-h-10 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 border-b-0 rounded-t-xl text-xs text-[#2277B4] dark:text-blue-300 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-1 shrink-0">
          <Lightbulb size={14} className="inline" /> Clic en
          <ChevronRight size={12} className="inline" /> para más
          detalles
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 transition-opacity duration-150 ${
              contacts.showContactFilters
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {contacts.contactQuickFilterButtons.map((button) => {
              const selectedValue = String(
                contacts.contactFilters[button.fieldName] || "",
              );

              return (
                <div
                  key={button.id}
                  className={`inline-flex items-center rounded-xl border text-xs transition-all backdrop-blur-md shadow-glass-sm ${
                    selectedValue
                      ? "border-[#2277B4] bg-white/90 dark:bg-dark-900 text-zinc-800 dark:text-zinc-200 dark:border-blue-500 shadow-glass-sm"
                      : "rounded-xl bg-white/70 dark:bg-dark-900/60 text-zinc-700 dark:text-zinc-300 border-white/25 dark:border-white/15 hover:bg-white/95 dark:hover:bg-dark-800"
                  }`}
                >
                  <button
                    onClick={() =>
                      contacts.openContactFilterPicker(
                        button.fieldName,
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-white/50 dark:hover:bg-white/5 rounded-l-xl transition-colors whitespace-nowrap"
                  >
                    <span className={`font-semibold tracking-wide ${selectedValue ? "text-[#2277B4] dark:text-blue-400 font-bold" : ""}`}>
                      {button.buttonLabel}
                    </span>
                    {selectedValue && (
                      <span className="max-w-28 truncate font-medium text-zinc-700 dark:text-zinc-300">
                        {selectedValue}
                      </span>
                    )}
                  </button>
                  {selectedValue && (
                    <button
                      type="button"
                      onClick={() => contacts.applyContactFilterValue(button.fieldName, "")}
                      className="pr-2 pl-0.5 py-1 text-black hover:text-red-500 dark:text-zinc-100 dark:hover:text-red-400 transition-colors flex items-center justify-center focus:outline-none"
                      title={`Quitar filtro ${button.buttonLabel}`}
                    >
                      <X size={12} className="text-black dark:text-zinc-100 hover:text-red-500" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={contacts.handleDownloadContactsTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-dark-900/60 border border-white/25 dark:border-white/15 hover:bg-white/95 dark:hover:bg-dark-700 transition-all backdrop-blur-md shadow-glass-sm whitespace-nowrap"
            title="Descargar plantilla de carga masiva de contactos"
          >
            <FileSpreadsheet size={13} /> Descargar plantilla excel
          </button>
        </div>
      </div>

      <ContactTable
        contactsTable={contacts.contactsTable}
        visibleContactRows={contacts.visibleContactRows}
        expandedContactRows={contacts.expandedContactRows}
        contactDetailColumns={contacts.contactDetailColumns}
        contactPrimaryColumns={contacts.contactPrimaryColumns}
        shouldEnableContactTableScroll={
          contacts.shouldEnableContactTableScroll
        }
        contactTableMinHeight={contacts.contactTableMinHeight}
        filteredContacts={contacts.filteredContacts}
        activeContactFilterCount={contacts.activeContactFilterCount}
      />

      {contacts.filteredContacts.length > 0 && (
        <ContactPagination
          table={contacts.contactsTable}
          pageSizes={[10, 25, 50, 100]}
        />
      )}

      <DisabledContactsTable
        disabledContacts={contacts.disabledContacts}
        showDisabled={contacts.showDisabled}
        setShowDisabled={contacts.setShowDisabled}
        disabledContactsTable={contacts.disabledContactsTable}
        visibleDisabledContactRows={
          contacts.visibleDisabledContactRows
        }
        shouldEnableDisabledContactsTableScroll={
          contacts.shouldEnableDisabledContactsTableScroll
        }
      />
    </Card>
  );
}
