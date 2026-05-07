import { useCallback, useState } from "react";
import api from "../api/axios";

const useApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async ({ url, method = "get", data: payload = null, params = null, headers = {} }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.request({
        url,
        method,
        data: payload,
        params,
        headers,
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      const apiError = err?.response?.data || err?.message || "Request failed";
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, params = {}, config = {}) => request({ url, method: "get", params, ...config }), [request]);

  const post = useCallback((url, payload = {}, config = {}) => request({ url, method: "post", data: payload, ...config }), [request]);

  const put = useCallback((url, payload = {}, config = {}) => request({ url, method: "put", data: payload, ...config }), [request]);
  
  const del = useCallback((url, payload = {}, config = {}) => request({ url, method: "delete", data: payload, ...config }), [request]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    request,
    get,
    post,
    put,
    del,
    reset,
  };
};

export default useApi;
