/**
 * QDPX Extraction Functions
 *
 * Functions for extracting content from QDPX zip files
 */

import * as fs from "fs";
import * as path from "path";
import * as JSZip from "jszip";
import { InvalidQDPXFileError } from "../utils/errors.js";

/**
 * Result of extracting a QDPX file
 */
interface QDPXExtractionResult {
  /**
   * Content of the project.qde file
   */
  qdeContent: string;

  /**
   * Map of source files (path: content)
   */
  sourceFiles: Map<string, Buffer>;
}

/**
 * Extracts a QDPX file (which is a ZIP file)
 *
 * @param qdpxFilePath Path to the QDPX file
 * @returns The extraction result with the QDE content and source files
 */
export async function extractQDPXFile(qdpxFilePath: string): Promise<QDPXExtractionResult> {
  try {
    // Read the QDPX file as a zip
    const qdpxData = await fs.promises.readFile(qdpxFilePath);
    const zip = await JSZip.loadAsync(qdpxData);

    // Extract the project.qde file
    const qdeFile = zip.file("project.qde");
    if (!qdeFile) {
      throw new InvalidQDPXFileError("Invalid QDPX file: project.qde not found");
    }

    const qdeContent = await qdeFile.async("text");

    // Extract source files
    const sourceFiles = new Map<string, Buffer>();

    // Get all files in the sources folder
    const sourceFileEntries = Object.entries(zip.files).filter(([filename]) => filename.startsWith("sources/") && !filename.endsWith("/"));

    // Read each source file
    for (const [filename, file] of sourceFileEntries) {
      const content = await file.async("nodebuffer");
      sourceFiles.set(filename, content);
    }

    return {
      qdeContent,
      sourceFiles,
    };
  } catch (error) {
    if (error instanceof InvalidQDPXFileError) {
      throw error;
    }
    throw new InvalidQDPXFileError(`Failed to extract QDPX file: ${error}`);
  }
}

/**
 * Extracts source files to the specified output directory
 *
 * @param sourceFiles Map of source files (path: content)
 * @param outputDirectory Directory where files should be extracted
 */
export async function extractSourceFiles(sourceFiles: Map<string, Buffer>, outputDirectory: string): Promise<void> {
  // Create output directory if it doesn't exist
  await fs.promises.mkdir(outputDirectory, { recursive: true });

  // Extract each file
  for (const [filename, content] of sourceFiles.entries()) {
    const basename = path.basename(filename);
    const outputPath = path.join(outputDirectory, basename);

    await fs.promises.writeFile(outputPath, content);
  }
}
