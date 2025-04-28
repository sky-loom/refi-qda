/**
 * REFI-QDA Import Module
 *
 * Main functions for importing QDPX files.
 */

import * as fs from "fs";
import * as path from "path";

import { Project } from "../refi-qda-interfaces.js";
import { ImportOptions, ImportResult } from "./options.js";
import { extractQDPXFile, extractSourceFiles } from "./extract.js";
import { parseQDEFile } from "./xml-parser.js";
import { resolveExternalSources } from "./source-resolver.js";
import { validateProjectAgainstSchema } from "./validators.js";
import { QDPXFileNotFoundError, InvalidQDPXFileError } from "../utils/errors.js";

/**
 * Imports a QDPX file and returns the Project structure
 *
 * @param qdpxFilePath Path to the QDPX file
 * @param options Import options
 * @returns Promise resolving to the import result
 */
export async function importQDPX(qdpxFilePath: string, options: ImportOptions = {}): Promise<ImportResult> {
  // Ensure file exists
  if (!fs.existsSync(qdpxFilePath)) {
    throw new QDPXFileNotFoundError(qdpxFilePath);
  }

  try {
    // Extract the QDPX file (ZIP)
    const { qdeContent, sourceFiles } = await extractQDPXFile(qdpxFilePath);

    // Parse the QDE file (XML)
    const project = await parseQDEFile(qdeContent);

    // Validate project against schema
    if (options.validateSchema !== false) {
      const validationErrors = await validateProjectAgainstSchema(project);
      if (validationErrors.length > 0) {
        throw new InvalidQDPXFileError("Project fails schema validation", validationErrors);
      }
    }

    // Set up source extraction directory
    const sourcesFolder = options.sourcesOutputPath || path.join(path.dirname(qdpxFilePath), "sources");

    // Extract internal sources if requested
    if (options.extractInternalSources !== false) {
      await extractSourceFiles(sourceFiles, sourcesFolder);
    }

    // Resolve external sources if requested
    const missingExternalSources: string[] = [];
    if (options.resolveExternalSources) {
      const externalBasePath =
        options.externalBasePath ||
        (project.basePath ? path.resolve(path.dirname(qdpxFilePath), project.basePath) : path.dirname(qdpxFilePath));

      const missingPaths = await resolveExternalSources(project, externalBasePath);
      missingExternalSources.push(...missingPaths);
    }

    return {
      project,
      missingExternalSources,
    };
  } catch (error) {
    if (error instanceof InvalidQDPXFileError) {
      throw error;
    }
    throw new InvalidQDPXFileError("Failed to import QDPX file " + error);
  }
}

// Re-export types
export * from "./options.js";
