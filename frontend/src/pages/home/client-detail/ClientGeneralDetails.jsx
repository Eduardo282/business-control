import { Building2, Edit2, Trash2 } from "@icons";
import Card from "../../../components/ui/Card";
import { isClientFieldFullWidth } from "./clientDetailHelpers";

export default function ClientGeneralDetails({
  client,
  clientGeneralFields,
  orphanClientGeneralFieldName,
  openEditClientModal,
  handleDeleteClient,
}) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-[#1a2b4c] dark:text-zinc-100 flex items-center gap-2">
          <Building2
            size={20}
            className="text-black dark:text-zinc-300"
          />{" "}
          Datos generales de {client.business_name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={openEditClientModal}
            className="p-1.5 rounded-lg text-[#92400E] dark:text-amber-400 transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/40"
            title="Editar"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDeleteClient}
            className="p-1.5 rounded-lg text-red-800 dark:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:scale-90 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
            title="Eliminar cliente"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {clientGeneralFields.map((field) => {
          const isFullWidthField =
            field.name === "business_name" ||
            isClientFieldFullWidth(field.name) ||
            field.name === orphanClientGeneralFieldName;

          return (
            <div
              key={field.name}
              className={`${
                isFullWidthField ? "md:col-span-2" : ""
              } h-full p-3.5 rounded-xl bg-white dark:bg-dark-800 border border-zinc-200/80 dark:border-dark-700 shadow-sm dark:shadow-black/20`}
            >
              <span className="text-xs font-semibold text-[#2277B4] dark:text-blue-400 uppercase block mb-1.5 tracking-wide">
                {field.label}
              </span>
              <div className="w-full overflow-visible">
                <div className="relative group/email inline-block max-w-full">
                  <div className="text-light-text-primary dark:text-zinc-100 truncate leading-relaxed">
                    {field.value}
                  </div>

                  {field.name === "email1" &&
                    field.value &&
                    field.value !== "—" && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 pointer-events-none opacity-0 group-hover/email:opacity-100 scale-95 translate-y-4 group-hover/email:-translate-y-6 group-hover/email:scale-100 transition-all duration-300 ease-out bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900 backdrop-blur-md text-blue-950 dark:text-blue-100 text-[11px] font-medium py-2 px-3.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-[0_10px_25px_rgba(0,0,0,0.25)] dark:shadow-black/50 whitespace-nowrap z-50 normal-case tracking-normal flex items-center gap-2">
                        <span>{field.value}</span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent dark:border-transparent border-t-blue-200 dark:border-t-blue-900"></div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
