// Filesystem path -> ESM module specifier.
//
// `import()` takes a URL, not a path. On POSIX an absolute path like
// `/home/x/content.js` happens to be accepted, so the difference is invisible
// there. On Windows `D:\IT\hakan\hakan-run-next\apps\web\src\content.js` parses
// as a URL whose scheme is the drive letter, and Node refuses it:
//
//   ERR_UNSUPPORTED_ESM_URL_SCHEME: Received protocol 'd:'
//
// The bug is not the backslashes and not the drive; it is passing a path where
// a URL was required, which POSIX forgives and Windows does not. `pathToFileURL`
// is the standard conversion and handles the drive, the separators and the
// characters that need escaping.

import { pathToFileURL } from 'node:url';

/** True for a specifier that is already a URL — but not for `C:\...`. */
const isUrl = (specifier) =>
  /^[a-z][a-z0-9+.-]*:/i.test(specifier) && !/^[a-z]:[\\/]/i.test(specifier);

/**
 * Convert a filesystem path into a specifier `import()` accepts on any platform.
 * A specifier that is already a URL is returned unchanged, so this is safe to
 * apply at every dynamic-import site without having to know which it is.
 */
export const toModuleUrl = (filePath) => (isUrl(filePath) ? filePath : pathToFileURL(filePath).href);
