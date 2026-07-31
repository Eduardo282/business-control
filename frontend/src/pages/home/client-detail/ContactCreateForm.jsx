import { UserPlus } from "@icons";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

export default function ContactCreateForm({
  client,
  newContact,
  setNewContact,
  addContact,
}) {
  return (
    <Card>
      <h3 className="font-semibold text-light-text-primary dark:text-zinc-100 mb-4 flex items-center gap-2">
        <UserPlus
          size={20}
          className="text-black dark:text-zinc-300"
        />{" "}
        Asignar Contacto a: {client.business_name}
      </h3>
      <form onSubmit={addContact} className="space-y-3">
        <Input
          label="Nombre completo *"
          value={newContact.full_name}
          onChange={(event) =>
            setNewContact({
              ...newContact,
              full_name: event.target.value,
            })
          }
          placeholder="Ej. Juan Pérez"
          required
        />
        <Input
          label="Correo electrónico *"
          value={newContact.email}
          onChange={(event) =>
            setNewContact({
              ...newContact,
              email: event.target.value,
            })
          }
          placeholder="ejemplo@correo.com"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Puesto"
            value={newContact.position_title}
            onChange={(event) =>
              setNewContact({
                ...newContact,
                position_title: event.target.value,
              })
            }
            placeholder="Ej. Gerente"
          />
          <Input
            label="Teléfono"
            value={newContact.phone}
            onChange={(event) =>
              setNewContact({
                ...newContact,
                phone: event.target.value,
              })
            }
            placeholder="A 10 dígitos"
          />
        </div>
        <button className="w-full px-4 py-2 text-sm text-white dark:text-white rounded-xl bg-[#2277B4] dark:bg-blue-700 hover:bg-[#125280] dark:hover:bg-blue-600 cursor-pointer transition-all duration-150 backdrop-blur-sm active:scale-95 active:translate-y-px shadow-lg shadow-[#2277B450] dark:shadow-black/30 font-bold focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40">
          Agregar Contacto
        </button>
      </form>
    </Card>
  );
}
