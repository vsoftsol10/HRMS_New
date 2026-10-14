import { useEffect, useState, useCallback, useRef } from "react";

export default function useFetch(service, params = {}) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  // The params key whose request has finished. While it differs from the
  // current key a request is in flight, so `loading` is derived instead of
  // being set synchronously inside an effect.
  const [settledKey, setSettledKey] = useState(null);
  const [reloading, setReloading] = useState(false);
  const requestId = useRef(0);

  const paramsKey = JSON.stringify(params);

  // Fetch only; state is applied by `apply` from a .then() callback.
  const fetchOutcome = useCallback(
    () =>
      service.getAll(JSON.parse(paramsKey)).then(
        (result) => ({ result }),
        (err) => ({ err }),
      ),
    [service, paramsKey],
  );

  // Only the latest request may write state, so a slow response for old
  // filters can never overwrite the result of newer ones.
  const apply = useCallback(
    (id, outcome) => {
      if (id !== requestId.current) return;

      if ("err" in outcome) {
        // A failed request (401, 500, network error) is exposed to the
        // caller instead of looking like "genuinely no records yet".
        console.error("useFetch error:", outcome.err);
        setError(outcome.err);
      } else {
        setData(outcome.result);
        setError(null);
      }

      setSettledKey(paramsKey);
      setReloading(false);
    },
    [paramsKey],
  );

  useEffect(() => {
    const id = ++requestId.current;

    fetchOutcome().then((outcome) => apply(id, outcome));
  }, [fetchOutcome, apply]);

  const reload = useCallback(() => {
    const id = ++requestId.current;

    setReloading(true);

    return fetchOutcome().then((outcome) => apply(id, outcome));
  }, [fetchOutcome, apply]);

  return {
    data,
    loading: reloading || settledKey !== paramsKey,
    error,
    reload,
  };
}