/**
 * QDPX Compression Functions
 *
 * Functions for compressing project data into QDPX files
 */

import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import { ExportError } from "../utils/errors.js";

/**
 * Creates a QDPX file (which is a ZIP file) with the project data
 *
 * @param outputPath Path where the QDPX file should be saved
 * @param qdeContent XML content of the project.qde file
 * @param sourceFiles Map of source files to include (path -> content)
 * @throws ExportError if the file creation fails
 */
export async function createQDPXFile(outputPath: string, qdeContent: string, sourceFiles: Map<string, Buffer>): Promise<void> {
  try {
    // Create a new zip file
    const zip = new JSZip();

    // Add the project.qde file
    zip.file("project.qde", qdeContent);

    // Create the sources folder
    const sourcesFolder = zip.folder("sources");

    // Add each source file
    for (const [filename, content] of sourceFiles.entries()) {
      // Make sure the path is relative to the sources folder
      const relativePath = filename.startsWith("sources/")
        ? filename.substring(8) // Remove 'sources/' prefix
        : filename;

      sourcesFolder?.file(relativePath, content);
    }

    // Generate the zip content
    const zipData = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9, // Maximum compression
      },
    });

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Write the zip file
    await fs.promises.writeFile(outputPath, zipData);
  } catch (error) {
    throw new ExportError(`Failed to create QDPX file: ${error}`);
  }
}
