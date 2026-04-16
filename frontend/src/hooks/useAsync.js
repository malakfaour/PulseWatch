import { useCallback, useEffect, useState } from "react";

export default function useAsync(asyncFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    run().catch(() => undefined);
  }, [run]);

  return { data, error, loading, refresh: run };
}
