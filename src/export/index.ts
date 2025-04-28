/**
 * REFI-QDA Export Module
 *
 * Main functions for exporting Project objects to QDPX files.
 */

import * as fs from "fs";
import * as path from "path";

import { Project } from "../refi-qda-interfaces.js";
import { ExportOptions, ExportResult } from "./options.js";
import { processSourcesForExport, updateProjectSourcePaths } from "./source-processor.js";
import { buildQDEFile } from "./xml-builder.js";
import { createQDPXFile } from "./compress.js";
import { validateProjectForExport } from "./validators.js";
import { ExportError } from "../utils/errors.js";

/**
 * Exports a Project to a QDPX file
 *
 * @param project The Project structure to export
 * @param outputPath Path where the QDPX file should be saved
 * @param options Export options
 * @returns Promise resolving to the export result
 */
export async function exportQDPX(project: Project, outputPath: string, options: ExportOptions = {}): Promise<ExportResult> {
  try {
    const warnings: string[] = [];
    const externalSources: string[] = [];

    // Create a deep copy of the project to avoid modifying the original
    const projectCopy = JSON.parse(JSON.stringify(project));

    // Configure options with defaults
    const exportOptions = {
      includeExternalSources: options.includeExternalSources ?? false,
      exportBasePath: options.exportBasePath || path.dirname(outputPath),
      maxInternalFileSize: options.maxInternalFileSize || 2147483647, // 2GB - 1 byte
      validateBeforeExport: options.validateBeforeExport ?? true,
      overwrite: options.overwrite ?? false,
    };

    // Check if output file exists and should not be overwritten
    if (fs.existsSync(outputPath) && !exportOptions.overwrite) {
      throw new ExportError(`Output file already exists: ${outputPath}. Use overwrite option to replace it.`);
    }

    // Update the project's basePath if we're using relative external sources
    if (!projectCopy.basePath && exportOptions.exportBasePath) {
      projectCopy.basePath = exportOptions.exportBasePath;
    }

    // Validate project before export if requested
    if (exportOptions.validateBeforeExport) {
      const validationErrors = validateProjectForExport(projectCopy);
      if (validationErrors.length > 0) {
        throw new ExportError("Project validation failed before export", validationErrors);
      }
    }

    // Process source files
    const { sourceFiles, sourceInfoList } = await processSourcesForExport(projectCopy, exportOptions, warnings, externalSources);

    // Update project with new source paths
    updateProjectSourcePaths(projectCopy, sourceInfoList);

    // Convert project to XML
    const qdeContent = buildQDEFile(projectCopy);

    // Create QDPX file
    await createQDPXFile(outputPath, qdeContent, sourceFiles);

    return {
      success: true,
      qdpxPath: outputPath,
      externalSources,
      warnings,
    };
  } catch (error) {
    if (error instanceof ExportError) {
      throw error;
    }
    throw new ExportError("Failed to export QDPX file:" + [error]);
  }
}

// Re-export types
export * from "./options.js";
