/**
 * Source Path Resolution Functions
 *
 * Functions for resolving and validating source paths during import
 */

import * as fs from "fs";
import * as path from "path";
import { Project } from "../refi-qda-interfaces.js";
import { PathResolutionError } from "../utils/errors.js";

/**
 * Source file with path information
 */
interface SourceFile {
  guid: string;
  sourcePath: string;
  sourceType: "internal" | "relative" | "absolute";
  exists: boolean;
}

/**
 * Resolves external source paths and checks if they exist
 *
 * @param project The project to resolve sources for
 * @param basePath Base path for resolving relative paths
 * @returns List of missing paths
 */
export async function resolveExternalSources(project: Project, basePath: string): Promise<string[]> {
  // Get all sources that need to be checked
  const sources = getAllSourcePaths(project);

  // Filter for external sources
  const externalSources = sources.filter((source) => source.sourceType === "relative" || source.sourceType === "absolute");

  // Resolve paths and check if they exist
  const missingPaths: string[] = [];

  for (const source of externalSources) {
    const fullPath = resolvePath(source.sourcePath, basePath, source.sourceType);

    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch (error) {
      missingPaths.push(fullPath);
    }
  }

  return missingPaths;
}

/**
 * Gets all source paths from a project
 *
 * @param project The project to get source paths from
 * @returns Array of source files with path information
 */
/**
 * Gets all source paths from the project
 *
 * @param project The project to get paths from
 * @returns Array of source files
 */
export function getAllSourcePaths(project: Project): SourceFile[] {
  const sourcePaths: SourceFile[] = [];

  if (!project.Sources) {
    return sourcePaths;
  }

  // Helper function to process a source
  const processSource = (source: { guid: string; path?: string; name?: string }) => {
    if (source.path) {
      sourcePaths.push({
        guid: source.guid,
        sourcePath: source.path,
        sourceType: getSourceType(source.path),
        exists: false,
      });
    }
  };

  // Process each source type with type-safe access
  if (project.Sources.TextSource) {
    for (const source of project.Sources.TextSource) {
      processSource(source);
    }
  }

  if (project.Sources.PictureSource) {
    for (const source of project.Sources.PictureSource) {
      processSource(source);
    }
  }

  if (project.Sources.PDFSource) {
    for (const source of project.Sources.PDFSource) {
      processSource(source);
    }
  }

  if (project.Sources.AudioSource) {
    for (const source of project.Sources.AudioSource) {
      processSource(source);
    }
  }

  if (project.Sources.VideoSource) {
    for (const source of project.Sources.VideoSource) {
      processSource(source);
    }
  }

  return sourcePaths;
}

/**
 * Determines the source type from a path string
 *
 * @param pathString The source path string
 * @returns The source type
 */
function getSourceType(pathString: string): "internal" | "relative" | "absolute" {
  if (pathString.startsWith("internal://")) {
    return "internal";
  } else if (pathString.startsWith("relative://")) {
    return "relative";
  } else if (pathString.startsWith("absolute://")) {
    return "absolute";
  }

  // Default to treating as a relative path if not specified
  return "relative";
}

/**
 * Resolves a path based on its type
 *
 * @param pathString The source path string
 * @param basePath Base path for resolving relative paths
 * @param sourceType The source type
 * @returns The resolved absolute path
 */
function resolvePath(pathString: string, basePath: string, sourceType: "internal" | "relative" | "absolute"): string {
  try {
    if (sourceType === "internal") {
      // For internal paths, extract the filename and resolve to the sources folder
      const filename = pathString.substring(11); // Remove 'internal://'
      return path.resolve(basePath, filename);
    } else if (sourceType === "relative") {
      // For relative paths, extract the relative path and resolve against the base path
      const relativePath = pathString.substring(11); // Remove 'relative://'

      // Handle paths with leading slashes correctly
      const cleanRelativePath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;

      return path.resolve(basePath, cleanRelativePath);
    } else if (sourceType === "absolute") {
      // For absolute paths, just extract the path
      const absolutePath = pathString.substring(11); // Remove 'absolute://'

      // Convert to platform-specific path if needed
      return absolutePath.replace(/\//g, path.sep);
    }

    // Default to treating as a relative path
    return path.resolve(basePath, pathString);
  } catch (error) {
    throw new PathResolutionError(`Failed to resolve path: ${pathString} ` + error);
  }
}
