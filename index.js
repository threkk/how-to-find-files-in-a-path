import { readdirSync, accessSync, constants, readdir } from 'fs'
import { readdir as readdirPromise, access as accessPromise } from 'fs/promises'
import { isAbsolute, resolve, join } from 'path'

export function listFiles(
  root,
  {
    ignored = ['.git', 'node_modules'],
    extensions = [],
    followSymlinks = false,
  }
) {}

/**
 * List all the files of a directory recursively. This is an synchronous
 * operation which will block the event loop for each file/folder.
 *
 * @param {string} root - Absolute path to list.
 * @param {Object} [props] - Configuration object.
 * @param {string[]} [props.ignored = ['.git', 'node_modules']] - List of elements to ignore. Defaults to ['.git', 'node_modules']
 * @param {string[]} [props.extensions = []] - List of accepted extenions. All if empty. Defaults to empty.
 * @param {boolean} [props.followSymlinks = false] - Wether to follow symlinks or not. Defaults to false.
 * @returns {string[]} - Recursive list of files in the path.
 */
export function listFilesSync(
  root,
  {
    ignored = ['.git', 'node_modules'],
    extensions = [],
    followSymlinks = false,
  }
) {
  // Generate the list of ignored patterns for a given folder.
  const ignoredItemsInFolder = (path) =>
    ignored.map((el) => {
      if (isAbsolute(el)) return el
      return resolve(join(path, el))
    })

  // Recursive call. In each directory we visit, we will list all the elements
  // in it and calculate the full path based on the provided root. We will
  // perform the following checks:
  //
  // 1 - If the path is ignored.
  // 2 - If the file exists and we can read it.
  // 3 - If it is symlink.
  //
  // After all those checks are positive, we will evaluate if it is a directory
  // or a file. If it is a directory, we perform a recursive call to evaluate
  // all the elements inside it. If it is a file, we will check if it is within
  // our list of approved file extensions to add it.
  function listDir(localRoot) {
    const items = []

    const dirs = readdirSync(localRoot, {
      encoding: 'utf-8',
      withFileTypes: true,
    })
    const ignored = ignoredItemsInFolder(localRoot)
    while (dirs != null && dirs.length > 0) {
      const peek = dirs.pop()
      const path = resolve(join(localRoot, peek.name))
      // Skipping if ignored
      if (ignored.includes(path)) continue

      try {
        accessSync(path, constants.F_OK | constants.R_OK)
      } catch {
        continue
      }

      if (!followSymlinks && peek.isSymbolicLink()) continue
      if (peek.isDirectory()) {
        items.push(...listDir(path))
        // Extname includes a dot.
      } else if (
        extensions.length === 0 ||
        extensions.includes(extname(path).substring(1))
      ) {
        items.push(path)
      }
    }
    return items
  }

  // Start on the root path provided.
  return listDir(root)
}
