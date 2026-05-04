export function handleApiError(error, fallbackMessage = 'Something went wrong') {
  if (!error) return fallbackMessage;

  // axios error with response
  const resp = error.response?.data;
  if (resp) {
    if (typeof resp === 'string') return resp;
    if (resp.detail) return resp.detail;
    if (resp.message) return resp.message;
    if (resp.error) return resp.error;
  }

  if (error.message) return error.message;

  return fallbackMessage;
}

export default handleApiError;
