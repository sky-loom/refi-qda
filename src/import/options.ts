/**
 * Options for REFI-QDA Import
 */

import { Project } from "../refi-qda-interfaces.js";

/**
 * Options for importing a QDPX file
 */
export interface ImportOptions {
  /**
   * Whether to validate the imported project against the XSD schema
   * @default true
   */
  validateSchema?: boolean;

  /**
   * Whether to extract internal source files
   * @default true
   */
  extractInternalSources?: boolean;

  /**
   * The path where internal source files will be extracted
   * @default "{qdpxDir}/sources"
   */
  sourcesOutputPath?: string;

  /**
   * Whether to attempt resolving external source files
   * @default false
   */
  resolveExternalSources?: boolean;

  /**
   * Base path for resolving relative external sources
   * If not provided, will use project.basePath or the directory of the QDPX file
   */
  externalBasePath?: string;

  /**
   * Callback for handling missing external sources
   * Return the new path to use, or undefined to leave as is
   */
  onMissingExternalSource?: (originalPath: string, sourceType: string, sourceGuid: string) => Promise<string | undefined>;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  /**
   * The imported project
   */
  project: Project;

  /**
   * List of external sources that couldn't be located
   */
  missingExternalSources: string[];
}
