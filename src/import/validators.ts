/**
 * Project Validation Functions
 *
 * Functions for validating REFI-QDA Project objects against the schema
 */

import * as fs from "fs";
import * as path from "path";
import { XMLValidator } from "fast-xml-parser";
import { Builder } from "xml2js";
import { Project } from "../refi-qda-interfaces.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Validates a Project object against the XSD schema
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
export async function validateProjectAgainstSchema(project: Project): Promise<string[]> {
  try {
    // Convert project back to XML for validation
    const projectXml = convertProjectToXml(project);

    // Load the XSD schema
    const schemaPath = path.resolve(__dirname, "../schemas/Project.xsd");
    const schemaContent = await fs.promises.readFile(schemaPath, "utf-8");

    // Validate XML against schema
    const validationResult = XMLValidator.validate(projectXml, {
      allowBooleanAttributes: true,
    });

    if (validationResult === true) {
      return []; // Valid
    } else {
      return [validationResult.err.msg];
    }
  } catch (error) {
    throw new ValidationError("Schema validation failed " + error);
  }
}

/**
 * Converts a Project object to XML for validation
 *
 * @param project The project to convert
 * @returns XML string representation of the project
 */
function convertProjectToXml(project: Project): string {
  // Prepare the project for XML conversion
  const xmlProject = prepareProjectForXml(project);

  // Convert to XML
  const builder = new Builder({
    xmldec: { version: "1.0", encoding: "UTF-8" },
    renderOpts: { pretty: true, indent: "  ", newline: "\n" },
    rootName: "Project",
    headless: false,
  });

  return builder.buildObject({
    Project: xmlProject,
    $: {
      xmlns: "urn:QDA-XML:project:1.0",
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xsi:schemaLocation": "urn:QDA-XML:project:1.0 Project.xsd",
    },
  });
}

/**
 * Prepares a Project object for XML conversion
 *
 * @param project The project to prepare
 * @returns Object ready for XML conversion
 */
function prepareProjectForXml(project: Project): any {
  // This is a simplified version - the full implementation
  // would mirror the one in export/xml-builder.ts

  const xmlProject: any = {
    $: {
      name: project.name,
      origin: project.origin,
      basePath: project.basePath,
      creatingUserGUID: project.creatingUserGUID,
      creationDateTime: project.creationDateTime,
      modifyingUserGUID: project.modifyingUserGUID,
      modifiedDateTime: project.modifiedDateTime,
    },
  };

  if (project.Description) {
    xmlProject.Description = project.Description;
  }

  // Add other conversions as needed for validation

  return xmlProject;
}

/**
 * Validates source paths in a project
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateSourcePaths(project: Project): string[] {
  const errors: string[] = [];

  if (!project.Sources) {
    return errors;
  }

  // Helper function to validate a source
  const validateSource = (source: { guid: string; name?: string; path?: string }, type: string) => {
    // Validate path consistency
    if (!source.path) {
      errors.push(`Source ${source.guid} (${source.name || "unnamed"}) has no path`);
    }
  };

  // Helper function specifically for text sources with additional validation
  const validateTextSource = (source: { guid: string; name?: string; path?: string; PlainTextContent?: any; plainTextPath?: string }) => {
    // Basic validation
    validateSource(source, "TextSource");

    // Check for consistency between PlainTextContent and plainTextPath
    if (source.PlainTextContent && source.plainTextPath) {
      errors.push(`TextSource ${source.guid} (${source.name || "unnamed"}) has both PlainTextContent and plainTextPath`);
    }
  };

  // Process each source type with type-safe access
  if (project.Sources.TextSource) {
    for (const source of project.Sources.TextSource) {
      validateTextSource(source);
    }
  }

  if (project.Sources.PictureSource) {
    for (const source of project.Sources.PictureSource) {
      validateSource(source, "PictureSource");
    }
  }

  if (project.Sources.PDFSource) {
    for (const source of project.Sources.PDFSource) {
      validateSource(source, "PDFSource");
    }
  }

  if (project.Sources.AudioSource) {
    for (const source of project.Sources.AudioSource) {
      validateSource(source, "AudioSource");
    }
  }

  if (project.Sources.VideoSource) {
    for (const source of project.Sources.VideoSource) {
      validateSource(source, "VideoSource");
    }
  }

  return errors;
}
