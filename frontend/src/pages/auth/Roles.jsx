import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "@icons";
import { createRoleApi, getRolesApi } from "../../actionsAPI/roles.api";
import AuthDecorativePanel from "../../components/ui/AuthDecorativePanel";

export default function Roles() {
  const navigate = useNavigate();

  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState([]);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [duplicateFlashRole, setDuplicateFlashRole] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [roleInputError, setRoleInputError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleNameRegex = /^[A-ZÁÉÍÓÚÜÑ\s]+$/;
  const normalizeRoleName = (value) =>
    value.trim().replace(/\s+/g, " ").toUpperCase();
  const sortRoles = (list) =>
    [...list].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );

  useEffect(() => {
    if (!duplicateFlashRole) return;

    const timeoutId = setTimeout(() => {
      setDuplicateFlashRole("");
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [duplicateFlashRole]);

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);
      setError("");
      try {
        const list = await getRolesApi();
        const sortedRoles = sortRoles(list);
        setRoles(sortedRoles);
        if (sortedRoles.length > 0) {
          setSelectedRoleName(sortedRoles[0].name);
        }
      } catch (err) {
        setError(err.message || "Error cargando roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const normalizedName = normalizeRoleName(roleName);

    setError("");
    setSuccess("");

    if (!normalizedName) {
      setError("Escribe un rol para continuar");
      return;
    }

    if (!roleNameRegex.test(normalizedName)) {
      setError(
        "El rol solo puede contener letras MAYUSCULAS y espacios (sin numeros ni signos).",
      );
      return;
    }

    const existingRole = roles.find(
      (role) => normalizeRoleName(role.name) === normalizedName,
    );
    if (existingRole) {
      setError(`El rol "${normalizedName}" ya existe`);
      setDuplicateFlashRole(existingRole.name);
      return;
    }

    setSavingRole(true);
    try {
      const created = await createRoleApi(normalizedName);
      setRoles((prev) => sortRoles([...prev, created]));
      setSelectedRoleName(created.name);
      setRoleName("");
      setDuplicateFlashRole("");
      setSuccess(`Rol "${created.name}" creado correctamente`);
    } catch (err) {
      setError(err.message || "Error al registrar rol");
    } finally {
      setSavingRole(false);
    }
  };

  const handleRoleNameChange = (e) => {
    const value = e.target.value;

    if (!value) {
      setRoleName("");
      setRoleInputError("");
      return;
    }

    if (roleNameRegex.test(value)) {
      setRoleName(value);
      setRoleInputError("");
      return;
    }

    setRoleInputError(
      "Solo se permiten letras MAYUSCULAS y espacios (sin numeros ni signos).",
    );
  };

  const goToRegisterWithSelectedRole = () => {
    if (!selectedRoleName) return;
    navigate("/register", { state: { selectedRole: selectedRoleName } });
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-900">
      <AuthDecorativePanel
        title="Gestion de Roles"
        description="Modulo de registro y administracion de roles."
      />

      <div className="relative flex w-full items-center justify-center bg-[#F1F4F8] p-8 dark:bg-dark-800 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl border border-zinc-300/80 bg-white/90 p-8 shadow-[0_30px_60px_-35px_rgba(22,42,66,0.55)] backdrop-blur-sm dark:border-white/15 dark:bg-dark-700/95 dark:shadow-black/50">
          <h1 className="mb-3 text-center text-3xl font-semibold text-[#153465] dark:text-zinc-100">
            Registrar Rol
          </h1>
          <p className="mb-8 text-center text-lg text-[#6f7f9a] dark:text-zinc-300">
            Ingresa un nuevo rol para el sistema
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#1a2b4c] dark:text-zinc-200">
                  Escribe el nuevo rol
                </label>
                <span className="text-sm text-[#64748b] dark:text-zinc-400">Solo MAYUSCULAS</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <Shield size={20} />
                </div>
                <input
                  type="text"
                  value={roleName}
                  onChange={handleRoleNameChange}
                  placeholder="EJ: SUPERVISOR"
                  pattern="[A-ZÁÉÍÓÚÜÑ ]+"
                  title="Solo letras MAYUSCULAS y espacios"
                  className="w-full rounded-2xl border border-[#64748b] bg-white py-3.5 pl-11 pr-4 text-zinc-950 transition-all placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] dark:border-white/25 dark:bg-dark-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
              {roleInputError && (
                <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">{roleInputError}</p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={savingRole}
              className="w-full rounded-2xl bg-[#2277B4] py-3.5 text-xl font-semibold text-white transition-colors hover:bg-[#125280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-700">
              {savingRole ? "Registrando…" : "Registrar Rol"}
            </button>
          </form>

          <div className="my-8 border-t border-zinc-300 dark:border-white/15" />

          <h2 className="mb-3 text-xl font-semibold text-[#1a2b4c] dark:text-zinc-100">
            Seleccionar un rol:
          </h2>

          <div className="flex min-h-[80px] max-h-[170px] flex-wrap content-start gap-2 overflow-y-auto rounded-2xl border border-zinc-300 bg-[#f7f8fb] p-3 pr-2 dark:border-white/15 dark:bg-dark-800">
            {loadingRoles && (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Cargando roles...</span>
            )}

            {!loadingRoles && roles.length === 0 && (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                Aun no hay roles registrados.
              </span>
            )}

            {!loadingRoles &&
              roles.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => setSelectedRoleName(role.name)}
                  className={`inline-flex items-center px-3 py-1 rounded-xl border text-sm font-semibold uppercase transition-colors ${
                    duplicateFlashRole === role.name ?
                      "border-red-400 bg-red-100 text-red-700 dark:border-red-600 dark:bg-red-950/60 dark:text-red-200"
                    : selectedRoleName === role.name ?
                      "border-[#1d4f7a] bg-[#1d4f7a] text-white dark:border-blue-400 dark:bg-blue-600"
                    : "border-[#94a3b8] bg-white text-[#334155] hover:bg-zinc-100 dark:border-white/20 dark:bg-dark-700 dark:text-zinc-200 dark:hover:bg-white/10"
                  }`}>
                  {role.name}
                </button>
              ))}
          </div>

          {selectedRoleName && (
            <p className="mt-3 text-sm text-[#1a2b4c] dark:text-zinc-200">
              Rol seleccionado:{" "}
              <span className="font-bold">{selectedRoleName}</span>
            </p>
          )}

          <button
            type="button"
            onClick={goToRegisterWithSelectedRole}
            disabled={!selectedRoleName}
            className="mt-4 w-full rounded-xl bg-[#2277B4] py-3 font-semibold text-white transition-colors hover:bg-[#125280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-700">
            Usar rol seleccionado
          </button>

          <div className="mt-8 flex items-center justify-between">
            <Link
              to="/register"
              state={
                selectedRoleName ?
                  { selectedRole: selectedRoleName }
                : undefined
              }
              className="inline-flex items-center gap-2 font-bold text-[#1a2b4c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] dark:text-zinc-200 dark:focus-visible:ring-blue-400">
              <ArrowLeft size={18} />
              Volver al Registro
            </Link>
            <Link
              to="/login"
              className="font-semibold text-[#64748b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] dark:text-zinc-300 dark:focus-visible:ring-blue-400">
              Ir al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
