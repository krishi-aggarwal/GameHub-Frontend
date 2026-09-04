export function getApiErrorMessage(
  error,
  fallback = 'Something went wrong.'
) {

  /*
   * Spring Boot ErrorResponse usually gives us
   * a message field.
   */

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  /*
   * Some responses may directly return a string.
   */

  if (typeof error?.response?.data === 'string') {
    return error.response.data;
  }

  /*
   * Axios/network failure.
   */

  if (error?.message) {
    return error.message;
  }

  return fallback;
}