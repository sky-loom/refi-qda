/**
 * XML Builder for REFI-QDA
 *
 * Functions for building QDE XML files from Project objects
 */

import { Builder } from "xml2js";
import {
  Project,
  CodeType,
  VariableType,
  VariableValueType,
  TextSourceType,
  PictureSourceType,
  PDFSourceType,
  AudioSourceType,
  VideoSourceType,
  PlainTextSelectionType,
  PictureSelectionType,
  PDFSelectionType,
  AudioSelectionType,
  VideoSelectionType,
  TranscriptType,
  TranscriptSelectionType,
  SyncPointType,
  CodingType,
  CaseType,
  SetType,
  GraphType,
  VertexType,
  EdgeType,
  LinkType,
  NoteRefType,
  CodeRefType,
  SourceRefType,
  SelectionRefType,
  VariableRefType,
} from "../refi-qda-interfaces.js";
import { ExportError } from "../utils/errors.js";

/**
 * Builds a QDE file from a Project object
 *
 * @param project The Project object to convert to XML
 * @returns XML string representation of the project
 */
export function buildQDEFile(project: Project): string {
  try {
    // Convert project to XML
    const builder = new Builder({
      xmldec: { version: "1.0", encoding: "UTF-8" },
      renderOpts: { pretty: true, indent: "  ", newline: "\n" },
      rootName: "Project",
      headless: false,
    });

    const xmlProject = prepareProjectForXml(project);

    return builder.buildObject({
      $: {
        xmlns: "urn:QDA-XML:project:1.0",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "urn:QDA-XML:project:1.0 Project.xsd",
      },
      Project: xmlProject,
    });
  } catch (error) {
    throw new ExportError("Failed to build QDE file", error instanceof Error ? [error.message] : undefined);
  }
}

/**
 * Prepares a Project object for XML conversion
 *
 * @param project The Project object to prepare
 * @returns Object ready for XML conversion
 */
export function prepareProjectForXml(project: Project): any {
  const xmlProject: any = {
    $: {
      name: project.name,
    },
  };

  // Add optional attributes
  const optionalAttributes = ["origin", "creatingUserGUID", "creationDateTime", "modifyingUserGUID", "modifiedDateTime", "basePath"];

  optionalAttributes.forEach((attr) => {
    const sourceAsRecord = project as Record<string, any>;
    if (sourceAsRecord[attr]) {
      xmlProject.$[attr] = sourceAsRecord[attr];
    }
  });
  // Add Description
  if (project.Description) {
    xmlProject.Description = project.Description;
  }

  // Add NoteRefs
  if (project.NoteRef && project.NoteRef.length > 0) {
    xmlProject.NoteRef = project.NoteRef.map((noteRef) => ({
      $: { targetGUID: noteRef.targetGUID },
    }));
  }

  // Add Users
  if (project.Users) {
    xmlProject.Users = {
      User: project.Users.User.map((user) => ({
        $: {
          guid: user.guid,
          name: user.name,
          id: user.id,
        },
      })),
    };
  }

  // Add CodeBook
  if (project.CodeBook) {
    xmlProject.CodeBook = {
      Codes: {
        Code: prepareCodesForXml(project.CodeBook.Codes.Code),
      },
    };
  }

  // Add Variables
  if (project.Variables) {
    xmlProject.Variables = {
      Variable: prepareVariablesForXml(project.Variables.Variable),
    };
  }

  // Add Cases
  if (project.Cases) {
    xmlProject.Cases = {
      Case: prepareCasesForXml(project.Cases.Case),
    };
  }

  // Add Sources
  if (project.Sources) {
    xmlProject.Sources = prepareSourcesForXml(project.Sources);
  }

  // Add Notes
  if (project.Notes) {
    xmlProject.Notes = {
      Note: prepareTextSourcesForXml(project.Notes.Note),
    };
  }

  // Add Links
  if (project.Links) {
    xmlProject.Links = {
      Link: prepareLinksForXml(project.Links.Link),
    };
  }

  // Add Sets
  if (project.Sets) {
    xmlProject.Sets = {
      Set: prepareSetsForXml(project.Sets.Set),
    };
  }

  // Add Graphs
  if (project.Graphs) {
    xmlProject.Graphs = {
      Graph: prepareGraphsForXml(project.Graphs.Graph),
    };
  }

  return xmlProject;
}

/**
 * Prepares Code objects for XML conversion
 */
function prepareCodesForXml(codes: CodeType[]): any[] {
  if (!codes || codes.length === 0) return [];

  return codes.map((code) => {
    const xmlCode: any = {
      $: {
        guid: code.guid,
        name: code.name,
        isCodable: code.isCodable,
      },
    };

    if (code.color) {
      xmlCode.$.color = code.color;
    }

    if (code.Description) {
      xmlCode.Description = code.Description;
    }

    if (code.NoteRef && code.NoteRef.length > 0) {
      xmlCode.NoteRef = code.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (code.Code && code.Code.length > 0) {
      xmlCode.Code = prepareCodesForXml(code.Code);
    }

    return xmlCode;
  });
}

/**
 * Prepares Variable objects for XML conversion
 */
function prepareVariablesForXml(variables: VariableType[]): any[] {
  if (!variables || variables.length === 0) return [];

  return variables.map((variable) => {
    const xmlVariable: any = {
      $: {
        guid: variable.guid,
        name: variable.name,
        typeOfVariable: variable.typeOfVariable,
      },
    };

    if (variable.Description) {
      xmlVariable.Description = variable.Description;
    }

    return xmlVariable;
  });
}

/**
 * Prepares VariableValue objects for XML conversion
 */
function prepareVariableValuesForXml(variableValues: VariableValueType[]): any[] {
  if (!variableValues || variableValues.length === 0) return [];

  return variableValues.map((value) => {
    const xmlValue: any = {
      VariableRef: {
        $: { targetGUID: value.VariableRef.targetGUID },
      },
    };

    // Add value based on type
    if (value.TextValue !== undefined) {
      xmlValue.TextValue = value.TextValue;
    } else if (value.BooleanValue !== undefined) {
      xmlValue.BooleanValue = value.BooleanValue;
    } else if (value.IntegerValue !== undefined) {
      xmlValue.IntegerValue = value.IntegerValue;
    } else if (value.FloatValue !== undefined) {
      xmlValue.FloatValue = value.FloatValue;
    } else if (value.DateValue !== undefined) {
      xmlValue.DateValue = value.DateValue;
    } else if (value.DateTimeValue !== undefined) {
      xmlValue.DateTimeValue = value.DateTimeValue;
    }

    return xmlValue;
  });
}

/**
 * Prepares Case objects for XML conversion
 */
function prepareCasesForXml(cases: CaseType[]): any[] {
  if (!cases || cases.length === 0) return [];

  return cases.map((caseItem) => {
    const xmlCase: any = {
      $: {
        guid: caseItem.guid,
        name: caseItem.name,
      },
    };

    if (caseItem.Description) {
      xmlCase.Description = caseItem.Description;
    }

    if (caseItem.CodeRef && caseItem.CodeRef.length > 0) {
      xmlCase.CodeRef = caseItem.CodeRef.map((codeRef) => ({
        $: { targetGUID: codeRef.targetGUID },
      }));
    }

    if (caseItem.VariableValue && caseItem.VariableValue.length > 0) {
      xmlCase.VariableValue = prepareVariableValuesForXml(caseItem.VariableValue);
    }

    if (caseItem.SourceRef && caseItem.SourceRef.length > 0) {
      xmlCase.SourceRef = caseItem.SourceRef.map((sourceRef) => ({
        $: { targetGUID: sourceRef.targetGUID },
      }));
    }

    if (caseItem.SelectionRef && caseItem.SelectionRef.length > 0) {
      xmlCase.SelectionRef = caseItem.SelectionRef.map((selectionRef) => ({
        $: { targetGUID: selectionRef.targetGUID },
      }));
    }

    return xmlCase;
  });
}

/**
 * Prepares Sources objects for XML conversion
 */
function prepareSourcesForXml(sources: any): any {
  const xmlSources: any = {};

  // Process each source type
  if (sources.TextSource && sources.TextSource.length > 0) {
    xmlSources.TextSource = prepareTextSourcesForXml(sources.TextSource);
  }

  if (sources.PictureSource && sources.PictureSource.length > 0) {
    xmlSources.PictureSource = preparePictureSourcesForXml(sources.PictureSource);
  }

  if (sources.PDFSource && sources.PDFSource.length > 0) {
    xmlSources.PDFSource = preparePDFSourcesForXml(sources.PDFSource);
  }

  if (sources.AudioSource && sources.AudioSource.length > 0) {
    xmlSources.AudioSource = prepareAudioSourcesForXml(sources.AudioSource);
  }

  if (sources.VideoSource && sources.VideoSource.length > 0) {
    xmlSources.VideoSource = prepareVideoSourcesForXml(sources.VideoSource);
  }

  return xmlSources;
}

/**
 * Prepares TextSource objects for XML conversion
 */
function prepareTextSourcesForXml(sources: TextSourceType[]): any[] {
  if (!sources || sources.length === 0) return [];

  return sources.map((source) => {
    const xmlSource: any = {
      $: {
        guid: source.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = [
      "name",
      "richTextPath",
      "plainTextPath",
      "creatingUser",
      "creationDateTime",
      "modifyingUser",
      "modifiedDateTime",
    ];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = source as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSource.$[attr] = sourceAsRecord[attr];
      }
    });

    if (source.Description) {
      xmlSource.Description = source.Description;
    }

    if (source.PlainTextContent) {
      xmlSource.PlainTextContent = source.PlainTextContent;
    }

    if (source.PlainTextSelection && source.PlainTextSelection.length > 0) {
      xmlSource.PlainTextSelection = preparePlainTextSelectionsForXml(source.PlainTextSelection);
    }

    if (source.Coding && source.Coding.length > 0) {
      xmlSource.Coding = prepareCodingsForXml(source.Coding);
    }

    if (source.NoteRef && source.NoteRef.length > 0) {
      xmlSource.NoteRef = source.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (source.VariableValue && source.VariableValue.length > 0) {
      xmlSource.VariableValue = prepareVariableValuesForXml(source.VariableValue);
    }

    return xmlSource;
  });
}

/**
 * Prepares PictureSource objects for XML conversion
 */
function preparePictureSourcesForXml(sources: PictureSourceType[]): any[] {
  if (!sources || sources.length === 0) return [];

  return sources.map((source) => {
    const xmlSource: any = {
      $: {
        guid: source.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "path", "currentPath", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = source as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSource.$[attr] = sourceAsRecord[attr];
      }
    });

    if (source.Description) {
      xmlSource.Description = source.Description;
    }

    if (source.TextDescription) {
      xmlSource.TextDescription = prepareTextSourcesForXml([source.TextDescription])[0];
    }

    if (source.PictureSelection && source.PictureSelection.length > 0) {
      xmlSource.PictureSelection = preparePictureSelectionsForXml(source.PictureSelection);
    }

    if (source.Coding && source.Coding.length > 0) {
      xmlSource.Coding = prepareCodingsForXml(source.Coding);
    }

    if (source.NoteRef && source.NoteRef.length > 0) {
      xmlSource.NoteRef = source.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (source.VariableValue && source.VariableValue.length > 0) {
      xmlSource.VariableValue = prepareVariableValuesForXml(source.VariableValue);
    }

    return xmlSource;
  });
}

/**
 * Prepares PDFSource objects for XML conversion
 */
function preparePDFSourcesForXml(sources: PDFSourceType[]): any[] {
  if (!sources || sources.length === 0) return [];

  return sources.map((source) => {
    const xmlSource: any = {
      $: {
        guid: source.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "path", "currentPath", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = source as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSource.$[attr] = sourceAsRecord[attr];
      }
    });

    if (source.Description) {
      xmlSource.Description = source.Description;
    }

    if (source.PDFSelection && source.PDFSelection.length > 0) {
      xmlSource.PDFSelection = preparePDFSelectionsForXml(source.PDFSelection);
    }

    if (source.Representation) {
      xmlSource.Representation = prepareTextSourcesForXml([source.Representation])[0];
    }

    if (source.Coding && source.Coding.length > 0) {
      xmlSource.Coding = prepareCodingsForXml(source.Coding);
    }

    if (source.NoteRef && source.NoteRef.length > 0) {
      xmlSource.NoteRef = source.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (source.VariableValue && source.VariableValue.length > 0) {
      xmlSource.VariableValue = prepareVariableValuesForXml(source.VariableValue);
    }

    return xmlSource;
  });
}

/**
 * Prepares AudioSource objects for XML conversion
 */
function prepareAudioSourcesForXml(sources: AudioSourceType[]): any[] {
  if (!sources || sources.length === 0) return [];

  return sources.map((source) => {
    const xmlSource: any = {
      $: {
        guid: source.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "path", "currentPath", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = source as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSource.$[attr] = sourceAsRecord[attr];
      }
    });

    if (source.Description) {
      xmlSource.Description = source.Description;
    }

    if (source.Transcript && source.Transcript.length > 0) {
      xmlSource.Transcript = prepareTranscriptsForXml(source.Transcript);
    }

    if (source.AudioSelection && source.AudioSelection.length > 0) {
      xmlSource.AudioSelection = prepareAudioSelectionsForXml(source.AudioSelection);
    }

    if (source.Coding && source.Coding.length > 0) {
      xmlSource.Coding = prepareCodingsForXml(source.Coding);
    }

    if (source.NoteRef && source.NoteRef.length > 0) {
      xmlSource.NoteRef = source.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (source.VariableValue && source.VariableValue.length > 0) {
      xmlSource.VariableValue = prepareVariableValuesForXml(source.VariableValue);
    }

    return xmlSource;
  });
}
/**
 * Prepares Links objects for XML conversion
 */
function prepareLinksForXml(links: LinkType[]): any[] {
  if (!links || links.length === 0) return [];

  return links.map((link) => {
    const xmlLink: any = {
      $: {
        guid: link.guid,
        name: link.name,
      },
    };

    // Add optional attributes
    if (link.direction) {
      xmlLink.$.direction = link.direction;
    }

    if (link.color) {
      xmlLink.$.color = link.color;
    }

    if (link.originGUID) {
      xmlLink.$.originGUID = link.originGUID;
    }

    if (link.targetGUID) {
      xmlLink.$.targetGUID = link.targetGUID;
    }

    if (link.NoteRef && link.NoteRef.length > 0) {
      xmlLink.NoteRef = link.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlLink;
  });
}

/**
 * Prepares Graphs objects for XML conversion
 */
function prepareGraphsForXml(graphs: GraphType[]): any[] {
  if (!graphs || graphs.length === 0) return [];

  return graphs.map((graph) => {
    const xmlGraph: any = {
      $: {
        guid: graph.guid,
        name: graph.name,
      },
    };

    if (graph.Vertex && graph.Vertex.length > 0) {
      xmlGraph.Vertex = prepareVerticesForXml(graph.Vertex);
    }

    if (graph.Edge && graph.Edge.length > 0) {
      xmlGraph.Edge = prepareEdgesForXml(graph.Edge);
    }

    return xmlGraph;
  });
}

/**
 * Prepares Vertex objects for XML conversion
 */
function prepareVerticesForXml(vertices: VertexType[]): any[] {
  if (!vertices || vertices.length === 0) return [];

  return vertices.map((vertex) => {
    const xmlVertex: any = {
      $: {
        guid: vertex.guid,
        firstX: vertex.firstX,
        firstY: vertex.firstY,
      },
    };

    // Add optional attributes
    if (vertex.representedGUID) {
      xmlVertex.$.representedGUID = vertex.representedGUID;
    }

    if (vertex.name) {
      xmlVertex.$.name = vertex.name;
    }

    if (vertex.secondX !== undefined) {
      xmlVertex.$.secondX = vertex.secondX;
    }

    if (vertex.secondY !== undefined) {
      xmlVertex.$.secondY = vertex.secondY;
    }

    if (vertex.shape) {
      xmlVertex.$.shape = vertex.shape;
    }

    if (vertex.color) {
      xmlVertex.$.color = vertex.color;
    }

    return xmlVertex;
  });
}

/**
 * Prepares Edge objects for XML conversion
 */
function prepareEdgesForXml(edges: EdgeType[]): any[] {
  if (!edges || edges.length === 0) return [];

  return edges.map((edge) => {
    const xmlEdge: any = {
      $: {
        guid: edge.guid,
        sourceVertex: edge.sourceVertex,
        targetVertex: edge.targetVertex,
      },
    };

    // Add optional attributes
    if (edge.representedGUID) {
      xmlEdge.$.representedGUID = edge.representedGUID;
    }

    if (edge.name) {
      xmlEdge.$.name = edge.name;
    }

    if (edge.color) {
      xmlEdge.$.color = edge.color;
    }

    if (edge.direction) {
      xmlEdge.$.direction = edge.direction;
    }

    if (edge.lineStyle) {
      xmlEdge.$.lineStyle = edge.lineStyle;
    }

    return xmlEdge;
  });
}

/**
 * Prepares Sets objects for XML conversion
 */
function prepareSetsForXml(sets: SetType[]): any[] {
  if (!sets || sets.length === 0) return [];

  return sets.map((set) => {
    const xmlSet: any = {
      $: {
        guid: set.guid,
        name: set.name,
      },
    };

    if (set.Description) {
      xmlSet.Description = set.Description;
    }

    if (set.MemberCode && set.MemberCode.length > 0) {
      xmlSet.MemberCode = set.MemberCode.map((codeRef) => ({
        $: { targetGUID: codeRef.targetGUID },
      }));
    }

    if (set.MemberSource && set.MemberSource.length > 0) {
      xmlSet.MemberSource = set.MemberSource.map((sourceRef) => ({
        $: { targetGUID: sourceRef.targetGUID },
      }));
    }

    if (set.MemberNote && set.MemberNote.length > 0) {
      xmlSet.MemberNote = set.MemberNote.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSet;
  });
}

/**
 * Prepares SyncPoint objects for XML conversion
 */
function prepareSyncPointsForXml(syncPoints: SyncPointType[]): any[] {
  if (!syncPoints || syncPoints.length === 0) return [];

  return syncPoints.map((syncPoint) => {
    const xmlSyncPoint: any = {
      $: {
        guid: syncPoint.guid,
      },
    };

    if (syncPoint.timeStamp !== undefined) {
      xmlSyncPoint.$.timeStamp = syncPoint.timeStamp;
    }

    if (syncPoint.position !== undefined) {
      xmlSyncPoint.$.position = syncPoint.position;
    }

    return xmlSyncPoint;
  });
}

/**
 * Prepares TranscriptSelection objects for XML conversion
 */
function prepareTranscriptSelectionsForXml(selections: TranscriptSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = [
      "name",
      "fromSyncPoint",
      "toSyncPoint",
      "creatingUser",
      "creationDateTime",
      "modifyingUser",
      "modifiedDateTime",
    ];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = selection as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSelection.$[attr] = sourceAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}

/**
 * Prepares Coding objects for XML conversion
 */
function prepareCodingsForXml(codings: CodingType[]): any[] {
  if (!codings || codings.length === 0) return [];

  return codings.map((coding) => {
    const xmlCoding: any = {
      $: {
        guid: coding.guid,
      },
      CodeRef: {
        $: { targetGUID: coding.CodeRef.targetGUID },
      },
    };

    if (coding.creatingUser) {
      xmlCoding.$.creatingUser = coding.creatingUser;
    }

    if (coding.creationDateTime) {
      xmlCoding.$.creationDateTime = coding.creationDateTime;
    }

    if (coding.NoteRef && coding.NoteRef.length > 0) {
      xmlCoding.NoteRef = coding.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlCoding;
  });
}

/**
 * Prepares PlainTextSelection objects for XML conversion
 */
function preparePlainTextSelectionsForXml(selections: PlainTextSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
        startPosition: selection.startPosition,
        endPosition: selection.endPosition,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const sourceAsRecord = selection as Record<string, any>;
      if (sourceAsRecord[attr]) {
        xmlSelection.$[attr] = sourceAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}

/**
 * Prepares Transcript objects for XML conversion
 */
function prepareTranscriptsForXml(transcripts: TranscriptType[]): any[] {
  if (!transcripts || transcripts.length === 0) return [];

  return transcripts.map((transcript) => {
    const xmlTranscript: any = {
      $: {
        guid: transcript.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = [
      "name",
      "richTextPath",
      "plainTextPath",
      "creatingUser",
      "creationDateTime",
      "modifyingUser",
      "modifiedDateTime",
    ];

    optionalAttributes.forEach((attr) => {
      const transAsRecord = transcript as Record<string, any>;
      if (transAsRecord[attr]) {
        xmlTranscript.$[attr] = transAsRecord[attr];
      }
    });

    if (transcript.Description) {
      xmlTranscript.Description = transcript.Description;
    }

    if (transcript.PlainTextContent) {
      xmlTranscript.PlainTextContent = transcript.PlainTextContent;
    }

    if (transcript.SyncPoint && transcript.SyncPoint.length > 0) {
      xmlTranscript.SyncPoint = prepareSyncPointsForXml(transcript.SyncPoint);
    }

    if (transcript.TranscriptSelection && transcript.TranscriptSelection.length > 0) {
      xmlTranscript.TranscriptSelection = prepareTranscriptSelectionsForXml(transcript.TranscriptSelection);
    }

    if (transcript.NoteRef && transcript.NoteRef.length > 0) {
      xmlTranscript.NoteRef = transcript.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlTranscript;
  });
}

/**
 * Prepares AudioSelection objects for XML conversion
 */
function prepareAudioSelectionsForXml(selections: AudioSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
        begin: selection.begin,
        end: selection.end,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const selAsRecord = selection as Record<string, any>;
      if (selAsRecord[attr]) {
        xmlSelection.$[attr] = selAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}

/**
 * Prepares PDFSelection objects for XML conversion
 */
function preparePDFSelectionsForXml(selections: PDFSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
        page: selection.page,
        firstX: selection.firstX,
        firstY: selection.firstY,
        secondX: selection.secondX,
        secondY: selection.secondY,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const selAsRecord = selection as Record<string, any>;
      if (selAsRecord[attr]) {
        xmlSelection.$[attr] = selAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Representation) {
      xmlSelection.Representation = prepareTextSourcesForXml([selection.Representation])[0];
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}

/**
 * Prepares PictureSelection objects for XML conversion
 */
function preparePictureSelectionsForXml(selections: PictureSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
        firstX: selection.firstX,
        firstY: selection.firstY,
        secondX: selection.secondX,
        secondY: selection.secondY,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const selAsRecord = selection as Record<string, any>;
      if (selAsRecord[attr]) {
        xmlSelection.$[attr] = selAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}

/**
 * Prepares VideoSource objects for XML conversion
 */
function prepareVideoSourcesForXml(sources: VideoSourceType[]): any[] {
  if (!sources || sources.length === 0) return [];

  return sources.map((source) => {
    const xmlSource: any = {
      $: {
        guid: source.guid,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "path", "currentPath", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const srcAsRecord = source as Record<string, any>;
      if (srcAsRecord[attr]) {
        xmlSource.$[attr] = srcAsRecord[attr];
      }
    });

    if (source.Description) {
      xmlSource.Description = source.Description;
    }

    if (source.Transcript && source.Transcript.length > 0) {
      xmlSource.Transcript = prepareTranscriptsForXml(source.Transcript);
    }

    if (source.VideoSelection && source.VideoSelection.length > 0) {
      xmlSource.VideoSelection = prepareVideoSelectionsForXml(source.VideoSelection);
    }

    if (source.Coding && source.Coding.length > 0) {
      xmlSource.Coding = prepareCodingsForXml(source.Coding);
    }

    if (source.NoteRef && source.NoteRef.length > 0) {
      xmlSource.NoteRef = source.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    if (source.VariableValue && source.VariableValue.length > 0) {
      xmlSource.VariableValue = prepareVariableValuesForXml(source.VariableValue);
    }

    return xmlSource;
  });
}
/**
 * Prepares VideoSelection objects for XML conversion
 */
function prepareVideoSelectionsForXml(selections: VideoSelectionType[]): any[] {
  if (!selections || selections.length === 0) return [];

  return selections.map((selection) => {
    const xmlSelection: any = {
      $: {
        guid: selection.guid,
        begin: selection.begin,
        end: selection.end,
      },
    };

    // Add optional attributes
    const optionalAttributes = ["name", "creatingUser", "creationDateTime", "modifyingUser", "modifiedDateTime"];

    optionalAttributes.forEach((attr) => {
      const selAsRecord = selection as Record<string, any>;
      if (selAsRecord[attr]) {
        xmlSelection.$[attr] = selAsRecord[attr];
      }
    });

    if (selection.Description) {
      xmlSelection.Description = selection.Description;
    }

    if (selection.Coding && selection.Coding.length > 0) {
      xmlSelection.Coding = prepareCodingsForXml(selection.Coding);
    }

    if (selection.NoteRef && selection.NoteRef.length > 0) {
      xmlSelection.NoteRef = selection.NoteRef.map((noteRef) => ({
        $: { targetGUID: noteRef.targetGUID },
      }));
    }

    return xmlSelection;
  });
}
