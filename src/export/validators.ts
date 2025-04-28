/**
 * Project Validation Functions for Export
 *
 * Functions for validating Project objects before export
 */

import { CodeRefType, CodeType, NoteRefType, Project, SelectionRefType, SourceRefType, VariableRefType } from "../refi-qda-interfaces.js";
import { buildQDEFile } from "./xml-builder.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Validates a Project object before export
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateProjectForExport(project: Project): string[] {
  const errors: string[] = [];

  // Check required project attributes
  if (!project.name) {
    errors.push("Project name is required");
  }

  // Validate GUIDs
  const guidErrors = validateProjectGUIDs(project);
  errors.push(...guidErrors);

  // Validate sources
  const sourceErrors = validateProjectSources(project);
  errors.push(...sourceErrors);

  // Validate references
  const referenceErrors = validateProjectReferences(project);
  errors.push(...referenceErrors);

  // Validate XML generation
  try {
    buildQDEFile(project);
  } catch (error) {
    errors.push(`XML generation error: ${error}`);
  }

  return errors;
}

/**
 * Validates GUIDs in a Project object
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateProjectGUIDs(project: Project): string[] {
  const errors: string[] = [];
  const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const guidMap = new Map<string, string>();

  // Check for duplicate GUIDs
  function checkGuid(guid: string, context: string): void {
    if (!guid) {
      errors.push(`Missing GUID in ${context}`);
      return;
    }

    if (!guidPattern.test(guid)) {
      errors.push(`Invalid GUID format in ${context}: ${guid}`);
      return;
    }

    if (guidMap.has(guid)) {
      errors.push(`Duplicate GUID ${guid} in ${context} and ${guidMap.get(guid)}`);
    } else {
      guidMap.set(guid, context);
    }
  }

  // Check Users
  if (project.Users) {
    project.Users.User.forEach((user, index) => {
      checkGuid(user.guid, `Users.User[${index}]`);
    });
  }

  // Check CodeBook
  if (project.CodeBook && project.CodeBook.Codes && project.CodeBook.Codes.Code) {
    function checkCodes(codes: any[], path: string): void {
      codes.forEach((code, index) => {
        checkGuid(code.guid, `${path}[${index}]`);

        if (code.Code) {
          checkCodes(code.Code, `${path}[${index}].Code`);
        }
      });
    }

    checkCodes(project.CodeBook.Codes.Code, "CodeBook.Codes.Code");
  }

  // Check Variables
  if (project.Variables && project.Variables.Variable) {
    project.Variables.Variable.forEach((variable, index) => {
      checkGuid(variable.guid, `Variables.Variable[${index}]`);
    });
  }

  // Check Cases
  if (project.Cases && project.Cases.Case) {
    project.Cases.Case.forEach((caseItem, index) => {
      checkGuid(caseItem.guid, `Cases.Case[${index}]`);
    });
  }

  // Helper function for checking source selections and codings
  const checkSourceSelections = (source: any, type: string, index: number, selectionType: string) => {
    // Check selections if they exist
    if (source[selectionType]) {
      source[selectionType].forEach((selection: any, selIndex: number) => {
        checkGuid(selection.guid, `Sources.${type}[${index}].${selectionType}[${selIndex}]`);

        // Check selection codings
        if (selection.Coding) {
          selection.Coding.forEach((coding: any, codingIndex: number) => {
            checkGuid(coding.guid, `Sources.${type}[${index}].${selectionType}[${selIndex}].Coding[${codingIndex}]`);
          });
        }
      });
    }

    // Check source codings if they exist
    if (source.Coding) {
      source.Coding.forEach((coding: any, codingIndex: number) => {
        checkGuid(coding.guid, `Sources.${type}[${index}].Coding[${codingIndex}]`);
      });
    }
  };

  // Helper function for checking transcripts
  const checkTranscripts = (source: any, type: string, index: number) => {
    if (source.Transcript) {
      source.Transcript.forEach((transcript: any, transIndex: number) => {
        checkGuid(transcript.guid, `Sources.${type}[${index}].Transcript[${transIndex}]`);

        // Check sync points
        if (transcript.SyncPoint) {
          transcript.SyncPoint.forEach((syncPoint: any, syncIndex: number) => {
            checkGuid(syncPoint.guid, `Sources.${type}[${index}].Transcript[${transIndex}].SyncPoint[${syncIndex}]`);
          });
        }

        // Check transcript selections
        if (transcript.TranscriptSelection) {
          transcript.TranscriptSelection.forEach((selection: any, selIndex: number) => {
            checkGuid(selection.guid, `Sources.${type}[${index}].Transcript[${transIndex}].TranscriptSelection[${selIndex}]`);
          });
        }
      });
    }
  };

  // Check Sources
  if (project.Sources) {
    // Check TextSource
    if (project.Sources.TextSource) {
      project.Sources.TextSource.forEach((source, index) => {
        checkGuid(source.guid, `Sources.TextSource[${index}]`);
        checkSourceSelections(source, "TextSource", index, "PlainTextSelection");
      });
    }

    // Check PictureSource
    if (project.Sources.PictureSource) {
      project.Sources.PictureSource.forEach((source, index) => {
        checkGuid(source.guid, `Sources.PictureSource[${index}]`);
        checkSourceSelections(source, "PictureSource", index, "PictureSelection");
      });
    }

    // Check PDFSource
    if (project.Sources.PDFSource) {
      project.Sources.PDFSource.forEach((source, index) => {
        checkGuid(source.guid, `Sources.PDFSource[${index}]`);
        checkSourceSelections(source, "PDFSource", index, "PDFSelection");
      });
    }

    // Check AudioSource
    if (project.Sources.AudioSource) {
      project.Sources.AudioSource.forEach((source, index) => {
        checkGuid(source.guid, `Sources.AudioSource[${index}]`);
        checkSourceSelections(source, "AudioSource", index, "AudioSelection");
        checkTranscripts(source, "AudioSource", index);
      });
    }

    // Check VideoSource
    if (project.Sources.VideoSource) {
      project.Sources.VideoSource.forEach((source, index) => {
        checkGuid(source.guid, `Sources.VideoSource[${index}]`);
        checkSourceSelections(source, "VideoSource", index, "VideoSelection");
        checkTranscripts(source, "VideoSource", index);
      });
    }
  }

  // Check Sets
  if (project.Sets && project.Sets.Set) {
    project.Sets.Set.forEach((set, index) => {
      checkGuid(set.guid, `Sets.Set[${index}]`);
    });
  }

  // Check Graphs
  if (project.Graphs && project.Graphs.Graph) {
    project.Graphs.Graph.forEach((graph, index) => {
      checkGuid(graph.guid, `Graphs.Graph[${index}]`);

      // Check vertices
      if (graph.Vertex) {
        graph.Vertex.forEach((vertex, vertexIndex) => {
          checkGuid(vertex.guid, `Graphs.Graph[${index}].Vertex[${vertexIndex}]`);
        });
      }

      // Check edges
      if (graph.Edge) {
        graph.Edge.forEach((edge, edgeIndex) => {
          checkGuid(edge.guid, `Graphs.Graph[${index}].Edge[${edgeIndex}]`);
        });
      }
    });
  }

  // Check Links
  if (project.Links && project.Links.Link) {
    project.Links.Link.forEach((link, index) => {
      checkGuid(link.guid, `Links.Link[${index}]`);
    });
  }

  return errors;
}
/**
 * Validates sources in a Project object
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateProjectSources(project: Project): string[] {
  const errors: string[] = [];

  if (!project.Sources) {
    return errors;
  }

  // Type guard for checking transcript properties
  function hasTranscriptProperties(transcript: any): transcript is {
    PlainTextContent?: any;
    plainTextPath?: string;
  } {
    return transcript && ("PlainTextContent" in transcript || "plainTextPath" in transcript);
  }

  // Type guard for text source properties
  function hasTextSourceProperties(source: any): source is {
    PlainTextContent?: any;
    plainTextPath?: string;
  } {
    return source && ("PlainTextContent" in source || "plainTextPath" in source);
  }

  // Helper function to validate a text source
  const validateTextSource = (source: any, index: number) => {
    if (!source.path) {
      errors.push(`Missing path in Sources.TextSource[${index}]`);
    }

    if (hasTextSourceProperties(source)) {
      if (source.PlainTextContent && source.plainTextPath) {
        errors.push(`Sources.TextSource[${index}] has both PlainTextContent and plainTextPath`);
      }

      if (!source.PlainTextContent && !source.plainTextPath) {
        errors.push(`Sources.TextSource[${index}] must have either PlainTextContent or plainTextPath`);
      }
    }
  };

  // Helper function to validate a non-text source
  const validateNonTextSource = (source: any, type: string, index: number) => {
    if (!source.path) {
      errors.push(`Missing path in Sources.${type}[${index}]`);
    }
  };

  // Helper function to validate audio/video transcript
  const validateTranscript = (source: any, type: string, index: number) => {
    if (!source.Transcript) {
      return;
    }

    source.Transcript.forEach((transcript: any, transIndex: number) => {
      if (hasTranscriptProperties(transcript)) {
        if (transcript.PlainTextContent && transcript.plainTextPath) {
          errors.push(`Sources.${type}[${index}].Transcript[${transIndex}] has both PlainTextContent and plainTextPath`);
        }

        if (!transcript.PlainTextContent && !transcript.plainTextPath) {
          errors.push(`Sources.${type}[${index}].Transcript[${transIndex}] must have either PlainTextContent or plainTextPath`);
        }
      }
    });
  };

  // Validate text sources
  if (project.Sources.TextSource) {
    project.Sources.TextSource.forEach((source, index) => {
      validateTextSource(source, index);
    });
  }

  // Validate picture sources
  if (project.Sources.PictureSource) {
    project.Sources.PictureSource.forEach((source, index) => {
      validateNonTextSource(source, "PictureSource", index);
    });
  }

  // Validate PDF sources
  if (project.Sources.PDFSource) {
    project.Sources.PDFSource.forEach((source, index) => {
      validateNonTextSource(source, "PDFSource", index);
    });
  }

  // Validate audio sources
  if (project.Sources.AudioSource) {
    project.Sources.AudioSource.forEach((source, index) => {
      validateNonTextSource(source, "AudioSource", index);
      validateTranscript(source, "AudioSource", index);
    });
  }

  // Validate video sources
  if (project.Sources.VideoSource) {
    project.Sources.VideoSource.forEach((source, index) => {
      validateNonTextSource(source, "VideoSource", index);
      validateTranscript(source, "VideoSource", index);
    });
  }

  return errors;
}
/**
 * Validates references in a Project object
 *
 * @param project The project to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateProjectReferences(project: Project): string[] {
  const errors: string[] = [];

  // Collect all GUIDs for reference validation
  const guids = new Set<string>();

  // Add all GUIDs from the project
  function addGuids(obj: any, path: string): void {
    if (!obj) return;

    if (obj.guid) {
      guids.add(obj.guid);
    }

    // Check all properties for nested objects or arrays
    for (const key in obj) {
      const value = obj[key];

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === "object") {
            addGuids(item, `${path}.${key}[${index}]`);
          }
        });
      } else if (value && typeof value === "object") {
        addGuids(value, `${path}.${key}`);
      }
    }
  }

  // Add all GUIDs from the project
  addGuids(project, "project");

  // Check all references
  function checkReference(guid: string, context: string): void {
    if (!guid) {
      errors.push(`Missing reference GUID in ${context}`);
      return;
    }

    if (!guids.has(guid)) {
      errors.push(`Invalid reference in ${context}: GUID ${guid} not found in project`);
    }
  }

  // Type guards and helper functions
  type NoteRef = { targetGUID: string };
  type CodeRef = { targetGUID: string };
  type SourceRef = { targetGUID: string };
  type SelectionRef = { targetGUID: string };
  type VariableRef = { targetGUID: string };

  // Check NoteRefs
  function checkNoteRefs(noteRefs: NoteRef[] | undefined, context: string): void {
    if (!noteRefs) return;

    noteRefs.forEach((noteRef, index) => {
      checkReference(noteRef.targetGUID, `${context}[${index}].targetGUID`);
    });
  }

  // Check CodeRefs
  function checkCodeRefs(codeRefs: CodeRef[] | undefined, context: string): void {
    if (!codeRefs) return;

    codeRefs.forEach((codeRef, index) => {
      checkReference(codeRef.targetGUID, `${context}[${index}].targetGUID`);
    });
  }

  // Check SourceRefs
  function checkSourceRefs(sourceRefs: SourceRef[] | undefined, context: string): void {
    if (!sourceRefs) return;

    sourceRefs.forEach((sourceRef, index) => {
      checkReference(sourceRef.targetGUID, `${context}[${index}].targetGUID`);
    });
  }

  // Check SelectionRefs
  function checkSelectionRefs(selectionRefs: SelectionRef[] | undefined, context: string): void {
    if (!selectionRefs) return;

    selectionRefs.forEach((selectionRef, index) => {
      checkReference(selectionRef.targetGUID, `${context}[${index}].targetGUID`);
    });
  }

  // Check VariableRefs
  function checkVariableRefs(variableRef: VariableRef | undefined, context: string): void {
    if (!variableRef) return;

    checkReference(variableRef.targetGUID, `${context}.targetGUID`);
  }

  // Check project NoteRefs
  if (project.NoteRef) {
    checkNoteRefs(project.NoteRef, "project.NoteRef");
  }

  // Check CodeBook references
  if (project.CodeBook && project.CodeBook.Codes && project.CodeBook.Codes.Code) {
    function checkCodeNoteRefs(codes: any[] | undefined, path: string): void {
      if (!codes) return;

      codes.forEach((code, index) => {
        if (code.NoteRef) {
          checkNoteRefs(code.NoteRef, `${path}[${index}].NoteRef`);
        }

        if (code.Code) {
          checkCodeNoteRefs(code.Code, `${path}[${index}].Code`);
        }
      });
    }

    checkCodeNoteRefs(project.CodeBook.Codes.Code, "project.CodeBook.Codes.Code");
  }

  // Check Cases references
  if (project.Cases && project.Cases.Case) {
    project.Cases.Case.forEach((caseItem, index) => {
      const casePath = `project.Cases.Case[${index}]`;

      if (caseItem.CodeRef) {
        checkCodeRefs(caseItem.CodeRef, `${casePath}.CodeRef`);
      }

      if (caseItem.VariableValue) {
        caseItem.VariableValue.forEach((value, valueIndex) => {
          if (value.VariableRef) {
            checkVariableRefs(value.VariableRef, `${casePath}.VariableValue[${valueIndex}].VariableRef`);
          }
        });
      }

      if (caseItem.SourceRef) {
        checkSourceRefs(caseItem.SourceRef, `${casePath}.SourceRef`);
      }

      if (caseItem.SelectionRef) {
        checkSelectionRefs(caseItem.SelectionRef, `${casePath}.SelectionRef`);
      }
    });
  }

  // Helper function to check source references
  const checkSourceReferences = (source: any, sourcePath: string) => {
    if (source.NoteRef) {
      checkNoteRefs(source.NoteRef, `${sourcePath}.NoteRef`);
    }

    if (source.Coding) {
      source.Coding.forEach((coding: any, codingIndex: number) => {
        const codingPath = `${sourcePath}.Coding[${codingIndex}]`;

        if (coding.CodeRef) {
          checkCodeRefs([coding.CodeRef], `${codingPath}.CodeRef`);
        }

        if (coding.NoteRef) {
          checkNoteRefs(coding.NoteRef, `${codingPath}.NoteRef`);
        }
      });
    }

    // Check variable values
    if (source.VariableValue) {
      source.VariableValue.forEach((value: any, valueIndex: number) => {
        if (value.VariableRef) {
          checkVariableRefs(value.VariableRef, `${sourcePath}.VariableValue[${valueIndex}].VariableRef`);
        }
      });
    }
  };

  // Helper function to check selection references
  const checkSelectionReferences = (source: any, sourcePath: string, selectionType: string) => {
    if (source[selectionType]) {
      source[selectionType].forEach((selection: any, selIndex: number) => {
        const selectionPath = `${sourcePath}.${selectionType}[${selIndex}]`;

        if (selection.NoteRef) {
          checkNoteRefs(selection.NoteRef, `${selectionPath}.NoteRef`);
        }

        if (selection.Coding) {
          selection.Coding.forEach((coding: any, codingIndex: number) => {
            const codingPath = `${selectionPath}.Coding[${codingIndex}]`;

            if (coding.CodeRef) {
              checkCodeRefs([coding.CodeRef], `${codingPath}.CodeRef`);
            }

            if (coding.NoteRef) {
              checkNoteRefs(coding.NoteRef, `${codingPath}.NoteRef`);
            }
          });
        }
      });
    }
  };

  // Helper function to check transcript references
  const checkTranscriptReferences = (source: any, sourcePath: string) => {
    if (source.Transcript) {
      source.Transcript.forEach((transcript: any, transIndex: number) => {
        const transcriptPath = `${sourcePath}.Transcript[${transIndex}]`;

        if (transcript.NoteRef) {
          checkNoteRefs(transcript.NoteRef, `${transcriptPath}.NoteRef`);
        }

        // Check transcript selections
        if (transcript.TranscriptSelection) {
          transcript.TranscriptSelection.forEach((selection: any, selIndex: number) => {
            const selectionPath = `${transcriptPath}.TranscriptSelection[${selIndex}]`;

            // Check fromSyncPoint and toSyncPoint
            if (selection.fromSyncPoint) {
              checkReference(selection.fromSyncPoint, `${selectionPath}.fromSyncPoint`);
            }

            if (selection.toSyncPoint) {
              checkReference(selection.toSyncPoint, `${selectionPath}.toSyncPoint`);
            }

            if (selection.NoteRef) {
              checkNoteRefs(selection.NoteRef, `${selectionPath}.NoteRef`);
            }

            if (selection.Coding) {
              selection.Coding.forEach((coding: any, codingIndex: number) => {
                const codingPath = `${selectionPath}.Coding[${codingIndex}]`;

                if (coding.CodeRef) {
                  checkCodeRefs([coding.CodeRef], `${codingPath}.CodeRef`);
                }

                if (coding.NoteRef) {
                  checkNoteRefs(coding.NoteRef, `${codingPath}.NoteRef`);
                }
              });
            }
          });
        }
      });
    }
  };

  // Check Sources references
  if (project.Sources) {
    // Check TextSource references
    if (project.Sources.TextSource) {
      project.Sources.TextSource.forEach((source, index) => {
        const sourcePath = `project.Sources.TextSource[${index}]`;
        checkSourceReferences(source, sourcePath);
        checkSelectionReferences(source, sourcePath, "PlainTextSelection");
      });
    }

    // Check PictureSource references
    if (project.Sources.PictureSource) {
      project.Sources.PictureSource.forEach((source, index) => {
        const sourcePath = `project.Sources.PictureSource[${index}]`;
        checkSourceReferences(source, sourcePath);
        checkSelectionReferences(source, sourcePath, "PictureSelection");
      });
    }

    // Check PDFSource references
    if (project.Sources.PDFSource) {
      project.Sources.PDFSource.forEach((source, index) => {
        const sourcePath = `project.Sources.PDFSource[${index}]`;
        checkSourceReferences(source, sourcePath);
        checkSelectionReferences(source, sourcePath, "PDFSelection");
      });
    }

    // Check AudioSource references
    if (project.Sources.AudioSource) {
      project.Sources.AudioSource.forEach((source, index) => {
        const sourcePath = `project.Sources.AudioSource[${index}]`;
        checkSourceReferences(source, sourcePath);
        checkSelectionReferences(source, sourcePath, "AudioSelection");
        checkTranscriptReferences(source, sourcePath);
      });
    }

    // Check VideoSource references
    if (project.Sources.VideoSource) {
      project.Sources.VideoSource.forEach((source, index) => {
        const sourcePath = `project.Sources.VideoSource[${index}]`;
        checkSourceReferences(source, sourcePath);
        checkSelectionReferences(source, sourcePath, "VideoSelection");
        checkTranscriptReferences(source, sourcePath);
      });
    }
  }

  // Check Sets references
  if (project.Sets && project.Sets.Set) {
    project.Sets.Set.forEach((set, index) => {
      const setPath = `project.Sets.Set[${index}]`;

      if (set.MemberCode) {
        checkCodeRefs(set.MemberCode, `${setPath}.MemberCode`);
      }

      if (set.MemberSource) {
        checkSourceRefs(set.MemberSource, `${setPath}.MemberSource`);
      }

      if (set.MemberNote) {
        checkNoteRefs(set.MemberNote, `${setPath}.MemberNote`);
      }
    });
  }

  // Check Links references
  if (project.Links && project.Links.Link) {
    project.Links.Link.forEach((link, index) => {
      const linkPath = `project.Links.Link[${index}]`;

      if (link.originGUID) {
        checkReference(link.originGUID, `${linkPath}.originGUID`);
      }

      if (link.targetGUID) {
        checkReference(link.targetGUID, `${linkPath}.targetGUID`);
      }

      if (link.NoteRef) {
        checkNoteRefs(link.NoteRef, `${linkPath}.NoteRef`);
      }
    });
  }

  // Check Graphs references
  if (project.Graphs && project.Graphs.Graph) {
    project.Graphs.Graph.forEach((graph, index) => {
      const graphPath = `project.Graphs.Graph[${index}]`;

      // Check vertex references
      if (graph.Vertex) {
        graph.Vertex.forEach((vertex, vertexIndex) => {
          if (vertex.representedGUID) {
            checkReference(vertex.representedGUID, `${graphPath}.Vertex[${vertexIndex}].representedGUID`);
          }
        });
      }

      // Check edge references
      if (graph.Edge) {
        graph.Edge.forEach((edge, edgeIndex) => {
          const edgePath = `${graphPath}.Edge[${edgeIndex}]`;

          if (edge.representedGUID) {
            checkReference(edge.representedGUID, `${edgePath}.representedGUID`);
          }

          // Check source and target vertex references
          if (edge.sourceVertex) {
            checkReference(edge.sourceVertex, `${edgePath}.sourceVertex`);
          }

          if (edge.targetVertex) {
            checkReference(edge.targetVertex, `${edgePath}.targetVertex`);
          }
        });
      }
    });
  }

  return errors;
}
