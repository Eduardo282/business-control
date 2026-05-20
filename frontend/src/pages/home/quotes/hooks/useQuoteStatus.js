import { useState, useEffect } from "react";
import { getQuoteApi } from "../../../../actionsAPI/quotes.api";

export function useQuoteStatus(id) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getQuoteApi(id);
      setQuote(data);
    } catch (e) {
      const msg =
        e.response?.data?.errors?.[0]?.message ||
        e.message ||
        "Error al cargar cotización";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  return {
    quote,
    setQuote,
    loading,
    setLoading,
    error,
    setError,
    load,
  };
}
