import { useState } from "react";
import { useClientRecord } from "./useClientRecord";
import { useContactsController } from "./useContactsController";

export function useClientDetailController({
  clientId,
  navigate,
  user,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const record = useClientRecord({ clientId, navigate });
  const contacts = useContactsController({
    clientId,
    contactRows: record.contactRows,
    contactDynamicColumns: record.contactDynamicColumns,
    contactExcelViewColumns: record.contactExcelViewColumns,
    setContactExcelViewColumns: record.setContactExcelViewColumns,
    contactColumnLabelOverrides:
      record.contactColumnLabelOverrides,
    setContactColumnLabelOverrides:
      record.setContactColumnLabelOverrides,
    load: record.load,
  });

  return {
    user,
    activeTab,
    setActiveTab,
    record,
    contacts,
  };
}
