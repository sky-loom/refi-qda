/**
 * Options for REFI-QDA Export
 */

/**
 * Options for exporting a Project to a QDPX file
 */
export interface ExportOptions {
  /**
   * Whether to include external sources inside the QDPX
   * @default false
   */
  includeExternalSources?: boolean;
  
  /**
   * Base path for external sources
   * @default directory of the QDPX file
   */
  exportBasePath?: string;
  
  /**
   * Maximum size in bytes for internal files
   * Any file larger than this will be kept as external
   * @default 2147483647 (2GB - 1 byte)
   */
  maxInternalFileSize?: number;
  
  /**
   * Whether to validate the project before export
   * @default true
   */
  validateBeforeExport?: boolean;
  
  /**
   * Whether to overwrite an existing file
   * @default false
   */
  overwrite?: boolean;
  
  /**
   * Callback for handling source files that cannot be found
   * Return true to continue export without the source, false to abort
   */
  onMissingSource?: (path: string, sourceType: string, guid: string) => Promise<boolean>;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /**
   * Whether the export was successful
   */
  success: boolean;
  
  /**
   * Path to the exported QDPX file
   */
  qdpxPath: string;
  
  /**
   * List of sources that were kept as external
   */
  externalSources: string[];
  
  /**
   * Any warnings during export
   */
  warnings: string[];
}
