/**
 * Source Processing for Export
 *
 * Functions for processing source files during QDPX export
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  Project,
  SourcesType,
  TextSourceType,
  PictureSourceType,
  PDFSourceType,
  AudioSourceType,
  VideoSourceType,
} from "../refi-qda-interfaces.js";
import { ExportOptions } from "./options.js";
import { ExportError } from "../utils/errors.js";

/**
 * Type guard to check if a source has path properties
 */
function hasPathProperties(source: any): source is { guid: string; path?: string; currentPath?: string } {
  return source && typeof source.guid === "string";
}

/**
 * Source reference with path information
 */
export interface SourceInfo {
  guid: string;
  originalPath: string;
  sourceType: "internal" | "relative" | "absolute";
  filename: string;
  extension: string;
}

/**
 * Result of processing sources for export
 */
export interface SourceProcessingResult {
  /**
   * Map of source files to include in the QDPX (path -> content)
   */
  sourceFiles: Map<string, Buffer>;

  /**
   * List of source info for updating project paths
   */
  sourceInfoList: SourceInfo[];
}

/**
 * Process sources for export
 *
 * @param project The project to process sources for
 * @param options Export options
 * @param warnings Array to add warnings to
 * @param externalSources Array to add external sources to
 * @returns The source processing result
 */
export async function processSourcesForExport(
  project: Project,
  options: ExportOptions,
  warnings: string[],
  externalSources: string[]
): Promise<SourceProcessingResult> {
  const sourceFiles = new Map<string, Buffer>();
  const sourceInfoList: SourceInfo[] = [];

  if (!project.Sources) {
    return { sourceFiles, sourceInfoList };
  }

  // Process each source type
  const processSource = async (
    source: TextSourceType | PictureSourceType | PDFSourceType | AudioSourceType | VideoSourceType,
    sourceType: string
  ) => {
    if (!hasPathProperties(source)) return;

    if (source.path) {
      // Determine if this is already an internal or external source
      if (source.path.startsWith("internal://")) {
        // Already an internal source, keep it that way
        const filename = source.path.substring(11);
        const sourceInfo: SourceInfo = {
          guid: source.guid,
          originalPath: source.currentPath || "",
          sourceType: "internal",
          filename: filename,
          extension: path.extname(filename),
        };
        sourceInfoList.push(sourceInfo);

        // If we have the original file path, try to add it to the zip
        if (source.currentPath) {
          try {
            const originalPath = resolveSourcePath(source.currentPath);
            const fileData = await readSourceFile(originalPath);
            sourceFiles.set(`sources/${filename}`, fileData);
          } catch (error) {
            warnings.push(`Could not include internal source: ${source.currentPath}`);
          }
        }
      } else {
        // External source - determine if we should include it
        try {
          const sourcePath = resolveSourcePath(source.path, options.exportBasePath);
          const filename = path.basename(sourcePath);
          const extension = path.extname(filename);

          try {
            // Check if file exists and get stats
            const stats = await fs.promises.stat(sourcePath);
            const maxSize = options.maxInternalFileSize ?? 2147483646; // Default if undefined

            if (stats.size <= maxSize && options.includeExternalSources) {
              // Include as internal source
              const newFilename = `${uuidv4()}${extension}`;
              const fileData = await readSourceFile(sourcePath);
              sourceFiles.set(`sources/${newFilename}`, fileData);

              sourceInfoList.push({
                guid: source.guid,
                originalPath: sourcePath,
                sourceType: "internal",
                filename: newFilename,
                extension,
              });
            } else {
              // Keep as external source
              externalSources.push(sourcePath);

              sourceInfoList.push({
                guid: source.guid,
                originalPath: sourcePath,
                sourceType: source.path.startsWith("absolute://") ? "absolute" : "relative",
                filename,
                extension,
              });
            }
          } catch (error) {
            // Handle missing source file
            const handleMissing = options.onMissingSource ? await options.onMissingSource(sourcePath, sourceType, source.guid) : true; // Default to continuing without the file

            if (!handleMissing) {
              throw new ExportError(`Export aborted due to missing source: ${sourcePath}`);
            }

            warnings.push(`Could not process source: ${sourcePath}`);

            // Keep the original paths
            sourceInfoList.push({
              guid: source.guid,
              originalPath: sourcePath,
              sourceType: source.path.startsWith("absolute://") ? "absolute" : "relative",
              filename,
              extension,
            });
          }
        } catch (error) {
          warnings.push(`Invalid source path: ${source.path}`);
        }
      }
    }
  };

  // Process each source collection type
  if (project.Sources.TextSource) {
    for (const source of project.Sources.TextSource) {
      await processSource(source, "TextSource");
    }
  }

  if (project.Sources.PictureSource) {
    for (const source of project.Sources.PictureSource) {
      await processSource(source, "PictureSource");
    }
  }

  if (project.Sources.PDFSource) {
    for (const source of project.Sources.PDFSource) {
      await processSource(source, "PDFSource");
    }
  }

  if (project.Sources.AudioSource) {
    for (const source of project.Sources.AudioSource) {
      await processSource(source, "AudioSource");
    }
  }

  if (project.Sources.VideoSource) {
    for (const source of project.Sources.VideoSource) {
      await processSource(source, "VideoSource");
    }
  }

  return { sourceFiles, sourceInfoList };
}

/**
 * Update source paths in the project
 *
 * @param project The project to update
 * @param sourceInfoList List of source info for updating paths
 */
export function updateProjectSourcePaths(project: Project, sourceInfoList: SourceInfo[]): void {
  // Create a map for quick lookup
  const sourceMap = new Map<string, SourceInfo>();
  sourceInfoList.forEach((info) => sourceMap.set(info.guid, info));

  if (!project.Sources) {
    return;
  }

  // Function to update a single source
  const updateSourcePath = (source: any, info: SourceInfo) => {
    if (!hasPathProperties(source)) return;

    // Update the source paths based on source type
    if (info.sourceType === "internal") {
      source.path = `internal://${info.filename}`;
      if ("currentPath" in source) {
        source.currentPath = `absolute:///${info.originalPath.replace(/\\/g, "/")}`;
      }
    } else if (info.sourceType === "relative") {
      // Create a path relative to the base path
      const relativePath = path.relative(project.basePath || "", info.originalPath);
      source.path = `relative:///${relativePath.replace(/\\/g, "/")}`;
      if ("currentPath" in source) {
        source.currentPath = `absolute:///${info.originalPath.replace(/\\/g, "/")}`;
      }
    } else {
      // Absolute path
      source.path = `absolute:///${info.originalPath.replace(/\\/g, "/")}`;
    }
  };

  // Process each source type collection
  if (project.Sources.TextSource) {
    for (const source of project.Sources.TextSource) {
      const info = sourceMap.get(source.guid);
      if (info) updateSourcePath(source, info);
    }
  }

  if (project.Sources.PictureSource) {
    for (const source of project.Sources.PictureSource) {
      const info = sourceMap.get(source.guid);
      if (info) updateSourcePath(source, info);
    }
  }

  if (project.Sources.PDFSource) {
    for (const source of project.Sources.PDFSource) {
      const info = sourceMap.get(source.guid);
      if (info) updateSourcePath(source, info);
    }
  }

  if (project.Sources.AudioSource) {
    for (const source of project.Sources.AudioSource) {
      const info = sourceMap.get(source.guid);
      if (info) updateSourcePath(source, info);
    }
  }

  if (project.Sources.VideoSource) {
    for (const source of project.Sources.VideoSource) {
      const info = sourceMap.get(source.guid);
      if (info) updateSourcePath(source, info);
    }
  }
}

/**
 * Resolves a source path based on its format
 *
 * @param pathString The path string to resolve
 * @param basePath Optional base path for relative paths
 * @returns The resolved path
 */
function resolveSourcePath(pathString: string, basePath?: string): string {
  if (pathString.startsWith("internal://")) {
    // For internal files, extract the filename
    const filename = pathString.substring(11);
    return basePath ? path.resolve(basePath, filename) : filename;
  } else if (pathString.startsWith("relative://")) {
    // For relative paths, extract the relative path and resolve against base path
    const relativePath = pathString.substring(11);

    if (!basePath) {
      throw new ExportError(`Base path required for relative path: ${pathString}`);
    }

    // Handle paths with leading slashes correctly
    const cleanRelativePath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;

    return path.resolve(basePath, cleanRelativePath);
  } else if (pathString.startsWith("absolute://")) {
    // For absolute paths, just extract the path
    const absolutePath = pathString.substring(11);

    // Convert to platform-specific path if needed
    return absolutePath.replace(/\//g, path.sep);
  }

  // Default to treating as a relative path if no prefix
  return basePath ? path.resolve(basePath, pathString) : pathString;
}

/**
 * Reads a source file and returns its content as a Buffer
 *
 * @param filePath Path to the file to read
 * @returns Buffer with the file content
 */
async function readSourceFile(filePath: string): Promise<Buffer> {
  try {
    return await fs.promises.readFile(filePath);
  } catch (error) {
    throw new ExportError(`Failed to read source file: ${filePath}: ` + error);
  }
}
