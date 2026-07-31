import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@icons";
import RegisterProductForm from "./registrar-products/RegisterProductForm";
import RegistrarProductModals from "./registrar-products/RegistrarProductModals";
import useRegistrarProductsController from "./registrar-products/useRegistrarProductsController";

export { CATALOG } from "./registrar-products/catalog";

export default function RegistrarProducts() {
  const { formProps, modalProps } = useRegistrarProductsController();

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-3 text-3xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
            <span>Registrar productos</span>
          </h1>
        </div>
        <Link
          to={"/productos"}
          className="text-[#2277B4] dark:text-blue-300 hover:text-[#125280] dark:hover:text-blue-200 text-sm font-semibold flex items-center gap-2 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a productos
        </Link>
      </div>

      <RegisterProductForm {...formProps} />
      <RegistrarProductModals {...modalProps} />
    </div>
  );
}
