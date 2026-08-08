import ClientEditModal from "./ClientEditModal";
import ClientGeneralDetails from "./ClientGeneralDetails";
import ClientDetailHeader from "./ClientDetailHeader";
import ContactBulkModal from "./ContactBulkModal";
import ContactCreateForm from "./ContactCreateForm";
import ContactEditModal from "./ContactEditModal";
import ContactsPanel from "./ContactsPanel";
import {
  ClientProductsTab,
  ManagePortalModal,
} from "./ClientDetailSections";
import {
  getClientFieldInputType,
  getContactFieldInputType,
  isClientFieldFullWidth,
  isClientFieldReadOnly,
} from "./clientDetailHelpers";

export default function ClientDetailView({ controller }) {
  const { activeTab, setActiveTab, contacts, record, user } =
    controller;

  if (record.loading) {
    return (
      <div className="flex h-64 items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
        Cargando información...
      </div>
    );
  }

  if (!record.client) {
    return (
      <div className="p-8 text-center text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
        Cliente no encontrado
      </div>
    );
  }

  const clientBusinessName = String(
    record.client.business_name || "Cliente",
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <ClientEditModal
        isOpen={record.isEditingClient}
        onClose={() => record.setIsEditingClient(false)}
        clientBusinessName={clientBusinessName}
        clientGeneralFields={record.clientGeneralFields}
        clientForm={record.clientForm}
        setClientForm={record.setClientForm}
        handleUpdateClient={record.handleUpdateClient}
        isClientFieldFullWidth={isClientFieldFullWidth}
        getClientFieldInputType={getClientFieldInputType}
        isClientFieldReadOnly={isClientFieldReadOnly}
      />

      {contacts.managingPortalContact && (
        <ManagePortalModal
          contact={contacts.managingPortalContact}
          onClose={(refresh) => {
            contacts.setManagingPortalContact(null);
            if (refresh) record.load();
          }}
          productsList={record.productsList}
        />
      )}

      <ClientDetailHeader
        client={record.client}
        error={record.error}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === "general" && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="space-y-6">
            <ClientGeneralDetails
              client={record.client}
              clientGeneralFields={record.clientGeneralFields}
              orphanClientGeneralFieldName={
                record.orphanClientGeneralFieldName
              }
              openEditClientModal={record.openEditClientModal}
              handleDeleteClient={record.handleDeleteClient}
            />
            <ContactCreateForm
              client={record.client}
              newContact={contacts.newContact}
              setNewContact={contacts.setNewContact}
              addContact={contacts.addContact}
            />
          </div>

          <div className="lg:col-span-2">
            <ContactsPanel
              client={record.client}
              user={user}
              contacts={contacts}
            />
          </div>
        </div>
      )}

      {activeTab === "products" && record.client && (
        <ClientProductsTab
          clientId={record.client.id}
          contacts={record.contactRows}
          productsList={record.productsList}
        />
      )}

      <ContactEditModal
        isOpen={!!contacts.editingContactId}
        onClose={() => contacts.setEditingContactId(null)}
        contactEditableColumns={contacts.contactEditableColumns}
        contactForm={contacts.contactForm}
        setContactForm={contacts.setContactForm}
        handleUpdateContact={contacts.handleUpdateContact}
        getContactFieldInputType={getContactFieldInputType}
      />

      <ContactBulkModal
        isOpen={contacts.showBulkContactModal}
        onClose={() => contacts.setShowBulkContactModal(false)}
        clientBusinessName={clientBusinessName}
        bulkContactDriveUrl={contacts.bulkContactDriveUrl}
        setBulkContactDriveUrl={contacts.setBulkContactDriveUrl}
        clearBulkContactDriveUrl={contacts.clearBulkContactDriveUrl}
        executeBulkContactDriveImport={
          contacts.executeBulkContactDriveImport
        }
        bulkContactDriveImporting={
          contacts.bulkContactDriveImporting
        }
        bulkContactResult={contacts.bulkContactResult}
        bulkContactFileRef={contacts.bulkContactFileRef}
        handleBulkContactFile={contacts.handleBulkContactFile}
        executeBulkContactUpload={
          contacts.executeBulkContactUpload
        }
        bulkContactUploading={contacts.bulkContactUploading}
        bulkContactErrors={contacts.bulkContactErrors}
        bulkContactData={contacts.bulkContactData}
      />
    </div>
  );
}
