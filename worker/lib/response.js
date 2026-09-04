export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });

export const problem = (code, status) => json({ error: code }, status);
export const notFound = () => problem('not_found', 404);
export const methodNotAllowed = (allow) =>
  json({ error: 'method_not_allowed' }, 405, { allow });
