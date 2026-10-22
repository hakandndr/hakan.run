// The application shell is the built index.html. Documents that have no file
// of their own (/contact, /card, the Boss shell, the private preview and the
// HTTP 404 document) start from it explicitly. Static Assets no longer return
// it for unmatched paths (not_found_handling "none"), so an unknown path can
// never become a 200 copy of the shell.
export const fetchAppShell = (request, env) => env.ASSETS.fetch(new Request(new URL('/', request.url)));
