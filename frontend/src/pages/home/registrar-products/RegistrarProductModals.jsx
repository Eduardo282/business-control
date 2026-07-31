import React from "react";
import { Library, Package, Shield, ShoppingBag } from "@icons";
import CategoryManagerModal from "./CategoryManagerModal";
import ProductSelectorModal from "./ProductSelectorModal";
import SourceSelectionModal from "./SourceSelectionModal";
import { PRODUCT_LOGO_MAP } from "./catalog";

export default function RegistrarProductModals({
  applyCategorySelection,
  availableCategories,
  categoryPage,
  closeCategoriesModal,
  closeSelector,
  closeSourceModal,
  filteredContpaqiProducts,
  filteredGeneralProducts,
  filteredPolicies,
  filteredServices,
  handleAddCategory,
  handleSourceSelection,
  isCategoriesModalOpen,
  isContpaqiModalOpen,
  isGeneralProductsModalOpen,
  isPoliciesModalOpen,
  isServicesModalOpen,
  isSourceModalOpen,
  newCategoryName,
  normalizeServicePolicyCategory,
  returnToSource,
  selectedCategory,
  selectProduct,
  setCategoryPage,
  setNewCategoryName,
  startNewProduct,
}) {
  return (
    <>
      <SourceSelectionModal
        isOpen={isSourceModalOpen}
        onClose={closeSourceModal}
        selectedCategory={selectedCategory}
        onSelectSource={handleSourceSelection}
      />

      <CategoryManagerModal
        isOpen={isCategoriesModalOpen}
        onClose={closeCategoriesModal}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        availableCategories={availableCategories}
        normalizeServicePolicyCategory={normalizeServicePolicyCategory}
        selectedCategory={selectedCategory}
        applyCategorySelection={applyCategorySelection}
        categoryPage={categoryPage}
        setCategoryPage={setCategoryPage}
      />

      <ProductSelectorModal
        isOpen={isContpaqiModalOpen}
        onClose={() => closeSelector("CONTPAQI")}
        onBack={() => returnToSource("CONTPAQI")}
        title="Productos de CONTPAQi"
        type="CONTPAQI"
        products={filteredContpaqiProducts}
        selectedCategory={selectedCategory}
        onSelectProduct={(item) => selectProduct(item, "CONTPAQI")}
        productLogoMap={PRODUCT_LOGO_MAP}
        Icon={Package}
        onNewProductClick={() => startNewProduct("CONTPAQI")}
      />

      <ProductSelectorModal
        isOpen={isPoliciesModalOpen}
        onClose={() => closeSelector("POLICY")}
        onBack={() => returnToSource("POLICY")}
        title="Pólizas"
        type="POLICY"
        products={filteredPolicies}
        selectedCategory={selectedCategory}
        onSelectProduct={(item) => selectProduct(item, "POLICY")}
        Icon={Shield}
        onNewProductClick={() => startNewProduct("POLICY")}
      />

      <ProductSelectorModal
        isOpen={isGeneralProductsModalOpen}
        onClose={() => closeSelector("PRODUCT")}
        onBack={() => returnToSource("PRODUCT")}
        title="Productos"
        type="PRODUCT"
        products={filteredGeneralProducts}
        selectedCategory={selectedCategory}
        onSelectProduct={(item) => selectProduct(item, "PRODUCT")}
        Icon={ShoppingBag}
        onNewProductClick={() => startNewProduct("PRODUCT")}
      />

      <ProductSelectorModal
        isOpen={isServicesModalOpen}
        onClose={() => closeSelector("SERVICE")}
        onBack={() => returnToSource("SERVICE")}
        title="Servicios"
        type="SERVICE"
        products={filteredServices}
        selectedCategory={selectedCategory}
        onSelectProduct={(item) => selectProduct(item, "SERVICE")}
        Icon={Library}
        onNewProductClick={() => startNewProduct("SERVICE")}
      />
    </>
  );
}
