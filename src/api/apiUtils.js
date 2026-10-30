export function getApiErrorMessage(
  error,
  fallback = 'Something went wrong.'
) {
  const data = error?.response?.data;

  const validationMessages = Array.isArray(data?.errors)
    ? data.errors
        .map((item) => {
          if (!item?.message) {
            return null;
          }

          return item.field
            ? `${item.field}: ${item.message}`
            : item.message;
        })
        .filter(Boolean)
    : [];

  if (validationMessages.length > 0) {
    return validationMessages.join('\n');
  }

  const title = data?.title;
  const detail = data?.msg || data?.detail;

  if (
    detail &&
    (!title || ['Unauthorized', 'Forbidden', 'Validation failed'].includes(title))
  ) {
    return detail;
  }

  if (title) {
    return title;
  }

  if (data?.message) {
    return data.message;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
}