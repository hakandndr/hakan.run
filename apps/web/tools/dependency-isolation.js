// Build isolation: the modernization checkout must build from its own
// dependency tree.
//
// During Phase 1B this repository had no dependency tree of its own. Both
// `node_modules` entries were Windows directory junctions pointing into the
// legacy checkout, which was recorded as temporary local tooling state. It was
// invisible in day-to-day use — Node resolution simply walked up, found the
// first `node_modules`, and followed the junction — and it meant a build of the
// modernization repository was really a build against another repository's
// dependencies. Deleting or reinstalling the legacy tree would have changed this
// build silently.
//
// The check is a repository-boundary rule, not a deny-list. Naming the legacy
// path would only catch the one arrangement we already know about; asking
// whether a dependency's real path is inside this repository catches every
// arrangement, including ones nobody has thought of yet.
//
// `realpath` is what makes it work: a junction or symlink is transparent to
// ordinary path handling and only reveals itself once the link is resolved.

import fs from 'node:fs';
import path from 'node:path';

/** Windows paths differ only by case; POSIX paths do not. */
export const caseInsensitiveFilesystem = () => process.platform === 'win32';

/**
 * Is `candidate` the repository root or something beneath it?
 *
 * Pure path arithmetic on already-resolved absolute paths. The separator is
 * required after the root so that a sibling sharing a prefix — `/x/repo-next`
 * against `/x/repo` — is correctly reported as outside.
 */
export const isInsideRepository = (
  repositoryRoot,
  candidate,
  caseInsensitive = caseInsensitiveFilesystem(),
) => {
  const normalise = (value) => {
    const resolved = path.resolve(value);
    return caseInsensitive ? resolved.toLowerCase() : resolved;
  };

  const root = normalise(repositoryRoot);
  const target = normalise(candidate);

  return target === root || target.startsWith(root + path.sep);
};

/**
 * Describe how a dependency escapes the repository, or null when it does not.
 *
 * Resolving the real path is the point of the check, so a path that cannot be
 * resolved is reported rather than assumed to be fine.
 */
export const isolationProblem = (repositoryRoot, resolvedPath, label = 'dependency') => {
  let realRoot;
  let realTarget;

  try {
    realRoot = fs.realpathSync(repositoryRoot);
    realTarget = fs.realpathSync(resolvedPath);
  } catch (error) {
    return `${label}: could not resolve a real path (${error.code ?? error.message})`;
  }

  if (isInsideRepository(realRoot, realTarget)) return null;

  return (
    `${label} resolves outside this repository.\n` +
    `  repository: ${realRoot}\n` +
    `  resolved  : ${realTarget}\n` +
    `  A dependency outside the repository means this build depends on another ` +
    `checkout, so it can change or break without anything here changing. Install ` +
    `this repository's own dependencies (npm ci at the repository root) and ` +
    `remove any node_modules junction or symlink that points elsewhere.`
  );
};
