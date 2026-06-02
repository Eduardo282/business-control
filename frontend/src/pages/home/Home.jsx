import { useAuth } from "../../hooks/useAuth";
import Clients from "./Clients";
import { Construction } from "@icons";

export default function Home() {
  const { user } = useAuth();

  // Para ADMIN y VENTAS, mostrar directamente la sección de clientes
  if (user?.role?.name === "ADMIN" || user?.role?.name === "VENTAS") {
    return <Clients />;
  }

  // Para SOPORTE, mostrar mensaje de desarrollo
  if (user?.role?.name === "SOPORTE") {
    return (
      <div className="bg-zinc-50 dark:bg-dark-700 p-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
        <div className="flex justify-center mb-4 opacity-50">
          <Construction size={48} />
        </div>
        <p className="text-zinc-500 font-medium">
          Módulo de Soporte Técnico en desarrollo
        </p>
        <div className="mt-2 text-xs text-zinc-400 font-mono bg-zinc-100 w-fit mx-auto px-3 py-1 rounded-lg">
          Status: Integracion_pendiente
        </div>
      </div>
    );
  }

  // Para otros roles
  return (
    <div className="text-center py-12">
      <p className="text-zinc-500">Bienvenido al sistema</p>
    </div>
  );
}
