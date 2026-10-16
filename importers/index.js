/**
 * Importer registry. To add a platform, create `importers/<platform>.js` exporting
 * { id, name, fileHint, instructions, detect(json), parse(json), openUrl(account) }
 * and register it here. See instagram.js for the reference implementation.
 */
import * as instagram from "./instagram.js";

export const importers = [instagram];

export function detectImporter(json) {
  return importers.find((imp) => imp.detect(json)) || null;
}
