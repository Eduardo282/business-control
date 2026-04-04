import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "@icons";
import { createRoleApi, getRolesApi } from "../../actionsAPI/roles.api";
import logo from "../../assets/logo.png";

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
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4A6B8A] to-[#162A42] relative overflow-hidden z-20 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center justify-center w-full px-12 relative z-10">
          <img
            src={logo}
            alt="Business Control"
            className="w-80 mb-8 drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
          />
          <h2 className="text-white text-3xl font-bold text-center mb-4">
            Gestion de Roles
          </h2>
          <p className="text-blue-100 text-center text-lg max-w-md leading-relaxed">
            Modulo de registro y administracion de roles.
          </p>
        </div>

        <div
          className="absolute top-0 right-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none translate-x-[10%] -translate-y-[10%]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 40%, transparent 70%)",
            boxShadow:
              "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
            filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.4))",
          }}></div>

        <div
          className="absolute bottom-0 left-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none -translate-x-[10%] translate-y-[10%]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05) 50%, transparent 70%)",
            boxShadow:
              "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
            filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.5))",
          }}></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F1F4F8] relative">
        <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/90 backdrop-blur-sm p-8 shadow-[0_30px_60px_-35px_rgba(22,42,66,0.55)]">
          <h1 className="text-3xl font-extrabold text-[#153465] text-center mb-3">
            Registrar Rol
          </h1>
          <p className="text-[#6f7f9a] text-center text-lg mb-8">
            Ingresa un nuevo rol para el sistema
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#1a2b4c] font-bold text-sm">
                  Escribe el nuevo rol
                </label>
                <span className="text-[#7987a0] text-sm">Solo MAYUSCULAS</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Shield size={20} />
                </div>
                <input
                  type="text"
                  value={roleName}
                  onChange={handleRoleNameChange}
                  placeholder="EJ: SUPERVISOR"
                  pattern="[A-ZÁÉÍÓÚÜÑ ]+"
                  title="Solo letras MAYUSCULAS y espacios"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#494949] bg-white text-black placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2277B4] focus:border-transparent transition-all"
                  required
                />
              </div>
              {roleInputError && (
                <p className="mt-2 text-xs text-red-600">{roleInputError}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={savingRole}
              className="w-full py-3.5 bg-[#8AB6D6] text-white text-xl font-semibold rounded-2xl hover:bg-[#2277B4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {savingRole ? "Registrando..." : "Registrar Rol"}
            </button>
          </form>

          <div className="my-8 border-t border-gray-200" />

          <h2 className="text-[#1a2b4c] font-bold text-xl mb-3">
            Seleccionar un rol:
          </h2>

          <div className="rounded-2xl border border-gray-200 bg-[#f7f8fb] p-3 min-h-[80px] max-h-[170px] overflow-y-auto flex flex-wrap gap-2 content-start pr-2">
            {loadingRoles && (
              <span className="text-sm text-gray-500">Cargando roles...</span>
            )}

            {!loadingRoles && roles.length === 0 && (
              <span className="text-sm text-gray-500">
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
                      "border-red-300 bg-red-100 text-red-700"
                    : selectedRoleName === role.name ?
                      "border-[#1d4f7a] bg-[#1d4f7a] text-white"
                    : "border-[#d9dfea] bg-white text-[#4b5d79] hover:bg-[#eef2f8]"
                  }`}>
                  {role.name}
                </button>
              ))}
          </div>

          {selectedRoleName && (
            <p className="mt-3 text-sm text-[#1a2b4c]">
              Rol seleccionado:{" "}
              <span className="font-bold">{selectedRoleName}</span>
            </p>
          )}

          <button
            type="button"
            onClick={goToRegisterWithSelectedRole}
            disabled={!selectedRoleName}
            className="w-full mt-4 py-3 rounded-xl bg-[#2277B4] text-white font-semibold hover:bg-[#125280] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
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
              className="inline-flex items-center gap-2 text-[#1a2b4c] font-bold hover:underline">
              <ArrowLeft size={18} />
              Volver al Registro
            </Link>
            <Link
              to="/login"
              className="text-[#64748b] font-semibold hover:underline">
              Ir al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
