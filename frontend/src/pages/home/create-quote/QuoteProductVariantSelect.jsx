import { formatQuoteProductVariantOption } from "./productGrouping";

export default function QuoteProductVariantSelect({
  product,
  onSelectVariant,
}) {
  if (!product?._groupItems?.length || product._groupCount <= 1) return null;

  return (
    <label className="mt-2 block max-w-xs">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-light-text-secondary dark:text-zinc-400">
        Elegir folio / precio
      </span>
      <select
        value={String(product.id)}
        onChange={(event) => {
          onSelectVariant?.(product._groupKey, event.target.value);
        }}
        className="w-full rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-[11px] font-semibold text-[#125280] outline-none transition-colors focus:border-[#2277B4] focus:ring-2 focus:ring-[#2277B4]/20 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
        aria-label={`Elegir folio y precio de ${product.name}`}
      >
        {product._groupItems.map((item) => (
          <option
            key={item.id}
            value={String(item.id)}
            className="bg-white text-zinc-800 dark:bg-dark-900 dark:text-zinc-100"
          >
            {formatQuoteProductVariantOption(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
