import { useEffect, useState } from "react";

export default function DiscountInputCell({
  item,
  setItems,
  clampDiscount,
  calculateItemTotal,
}) {
  const [localDiscount, setLocalDiscount] = useState(item.discount ?? 0);

  useEffect(() => {
    setLocalDiscount(item.discount ?? 0);
  }, [item.discount]);

  const commitChange = (value) => {
    const nextDiscount = clampDiscount(value);
    setLocalDiscount(nextDiscount);
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === item.tempId ?
          {
            ...i,
            discount: nextDiscount,
            total: calculateItemTotal(i.price, i.quantity, nextDiscount),
          }
        : i,
      ),
    );
  };

  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.01"
      value={localDiscount}
      onChange={(e) => setLocalDiscount(e.target.value)}
      onBlur={(e) => commitChange(e.target.value)}
      className="w-20 px-2 py-1 rounded-md border border-light-border dark:border-dark-700 bg-white dark:bg-dark-900 text-xs font-mono text-right text-[#125280] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
      style={{ colorScheme: "dark light" }}
    />
  );
}
