# REFI-QDA TypeScript Library

A TypeScript implementation of the Rotterdam Exchange Format Initiative (REFI) Qualitative Data Analysis (QDA) format specification.

## Overview

This library provides TypeScript interfaces and utilities for working with REFI-QDA files (QDPX), which are used for exchanging qualitative research data between different QDA software tools. REFI-QDA is a standardized format maintained by [REFI-QDA Consortium](https://www.qdasoftware.org/).

The library supports:

- Parsing QDPX files to TypeScript objects
- Creating and modifying REFI-QDA project data
- Exporting TypeScript objects to QDPX files
- Validating REFI-QDA projects against the schema

## Installation

```bash
npm install @skyloom/refi-qda
```

Dependencies:

```bash
npm install uuid xml2js jszip fast-xml-parser
npm install @types/uuid @types/xml2js @types/jszip --save-dev
```

## Usage

### Importing a QDPX File

```typescript
import { importQDPX } from "@skyloom/refi-qda";

async function example() {
  const importResult = await importQDPX("project.qdpx", {
    resolveExternalSources: true,
    extractInternalSources: true,
  });

  console.log("Project name:", importResult.project.name);

  if (importResult.missingExternalSources.length > 0) {
    console.log("Missing external sources:", importResult.missingExternalSources);
  }
}
```

### Creating a New Project

```typescript
import { Project, exportQDPX, generateGUID } from "@skyloom/refi-qda";

async function example() {
  // Create a simple project
  const project: Project = {
    name: "My REFI-QDA Project",
    creationDateTime: new Date().toISOString(),

    // Add users
    Users: {
      User: [{ guid: generateGUID(), name: "John Doe", id: "user1" }],
    },

    // Add codebook
    CodeBook: {
      Codes: {
        Code: [
          {
            guid: generateGUID(),
            name: "Category 1",
            isCodable: false,
            Code: [
              {
                guid: generateGUID(),
                name: "Code 1",
                isCodable: true,
                color: "#FF0000",
              },
            ],
          },
        ],
      },
    },

    // Add sources
    Sources: {
      TextSource: [
        {
          guid: generateGUID(),
          name: "Interview Transcript",
          PlainTextContent: "This is sample text content for the source.",
          creationDateTime: new Date().toISOString(),
        },
      ],
    },
  };

  // Export the project
  const exportResult = await exportQDPX(project, "new-project.qdpx", {
    includeExternalSources: true,
  });

  console.log("Export successful:", exportResult.success);
}
```

### Working with Sources

The library supports different types of sources as defined in the REFI-QDA specification:

- TextSource: Text documents
- PictureSource: Images
- PDFSource: PDF documents
- AudioSource: Audio files
- VideoSource: Video files

Sources can be referenced in three ways:

- `internal://`: Files embedded within the QDPX file
- `relative://`: Files referenced relative to a base path
- `absolute://`: Files referenced with absolute paths

Example:

```typescript
// Add an external source to a project
project.Sources.VideoSource = [
  {
    guid: generateGUID(),
    name: "Interview Video",
    path: "relative:///videos/interview.mp4",
    currentPath: "absolute:///C:/Research/videos/interview.mp4",
  },
];
```

## API Reference

### Import Functions

- `importQDPX(qdpxFilePath, options)`: Imports a QDPX file
  - Options:
    - `validateSchema`: Whether to validate against XSD schema (default: true)
    - `extractInternalSources`: Whether to extract internal sources (default: true)
    - `sourcesOutputPath`: Path for extracted sources (default: "{qdpxDir}/sources")
    - `resolveExternalSources`: Whether to check external sources (default: false)
    - `externalBasePath`: Base path for resolving relative sources

### Export Functions

- `exportQDPX(project, outputPath, options)`: Exports a project to a QDPX file
  - Options:
    - `includeExternalSources`: Whether to include external sources (default: false)
    - `exportBasePath`: Base path for external sources
    - `maxInternalFileSize`: Maximum size for internal files (default: 2GB - 1 byte)
    - `validateBeforeExport`: Whether to validate before export (default: true)
    - `overwrite`: Whether to overwrite existing file (default: false)

### Utility Functions

- `generateGUID()`: Generates a new UUID v4
- `isValidGUID(guid)`: Validates a GUID format
- `formatGUID(guid)`: Formats a GUID to standard format

## Error Handling

The library provides specific error classes for different error scenarios:

- `REFIQDAError`: Base error class
- `InvalidQDPXFileError`: For invalid QDPX files
- `QDPXFileNotFoundError`: For missing QDPX files
- `ValidationError`: For validation failures
- `PathResolutionError`: For path resolution problems
- `ExportError`: For export failures

Example:

```typescript
import { importQDPX, InvalidQDPXFileError, QDPXFileNotFoundError } from "refi-qda-ts";

try {
  const result = await importQDPX("project.qdpx");
} catch (error) {
  if (error instanceof QDPXFileNotFoundError) {
    console.error("File not found:", error.message);
  } else if (error instanceof InvalidQDPXFileError) {
    console.error("Invalid QDPX file:", error.message);
    console.error("Details:", error.details);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## License

This library is licensed under the MIT license.

## Acknowledgements

This project is based on the [REFI-QDA Specification](https://www.qdasoftware.org/), which is maintained by the REFI-QDA Consortium.
