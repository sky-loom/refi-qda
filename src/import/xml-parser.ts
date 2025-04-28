/**
 * XML Parser for REFI-QDA
 *
 * Functions for parsing QDE XML files and converting to Project objects
 */

import { parseStringPromise } from "xml2js";
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
import { InvalidQDPXFileError } from "../utils/errors.js";

/**
 * Parses a QDE file and returns a Project object
 *
 * @param qdeContent The XML content of the project.qde file
 * @returns The parsed Project object
 */
export async function parseQDEFile(qdeContent: string): Promise<Project> {
  try {
    const xmlProject = await parseStringPromise(qdeContent, {
      explicitArray: false,
      mergeAttrs: true,
      normalizeTags: false,
      attrNameProcessors: [(name) => name],
    });

    if (!xmlProject.Project) {
      throw new InvalidQDPXFileError("Invalid QDE file: <Project> element not found");
    }

    return convertXmlToProject(xmlProject.Project);
  } catch (error) {
    if (error instanceof InvalidQDPXFileError) {
      throw error;
    }
    throw new InvalidQDPXFileError(`Failed to parse QDE file: ${error}`);
  }
}

/**
 * Converts an XML Project element to a Project object
 *
 * @param xmlProject The XML Project element from xml2js
 * @returns The converted Project object
 */
export function convertXmlToProject(xmlProject: any): Project {
  const project: Project = {
    name: xmlProject.name,
    origin: xmlProject.origin,
    creatingUserGUID: xmlProject.creatingUserGUID,
    creationDateTime: xmlProject.creationDateTime,
    modifyingUserGUID: xmlProject.modifyingUserGUID,
    modifiedDateTime: xmlProject.modifiedDateTime,
    basePath: xmlProject.basePath,
    Description: xmlProject.Description,
  };

  // Convert NoteRefs
  if (xmlProject.NoteRef) {
    project.NoteRef = convertNoteRefs(xmlProject.NoteRef);
  }

  // Convert Users
  if (xmlProject.Users) {
    project.Users = {
      User: Array.isArray(xmlProject.Users.User) ? xmlProject.Users.User : [xmlProject.Users.User],
    };
  }

  // Convert CodeBook
  if (xmlProject.CodeBook) {
    project.CodeBook = {
      Codes: {
        Code: convertCodes(xmlProject.CodeBook.Codes.Code),
      },
    };
  }

  // Convert Variables
  if (xmlProject.Variables) {
    project.Variables = {
      Variable: convertVariables(xmlProject.Variables.Variable),
    };
  }

  // Convert Cases
  if (xmlProject.Cases) {
    project.Cases = {
      Case: convertCases(xmlProject.Cases.Case),
    };
  }

  // Convert Sources
  if (xmlProject.Sources) {
    project.Sources = convertSources(xmlProject.Sources);
  }

  // Convert Notes
  if (xmlProject.Notes) {
    project.Notes = {
      Note: convertNotes(xmlProject.Notes.Note),
    };
  }

  // Convert Links
  if (xmlProject.Links) {
    project.Links = {
      Link: convertLinks(xmlProject.Links.Link),
    };
  }

  // Convert Sets
  if (xmlProject.Sets) {
    project.Sets = {
      Set: convertSets(xmlProject.Sets.Set),
    };
  }

  // Convert Graphs
  if (xmlProject.Graphs) {
    project.Graphs = {
      Graph: convertGraphs(xmlProject.Graphs.Graph),
    };
  }

  return project;
}

/**
 * Converts XML NoteRef elements to NoteRefType objects
 */
function convertNoteRefs(xmlNoteRefs: any): NoteRefType[] {
  if (!xmlNoteRefs) return [];

  const noteRefs = Array.isArray(xmlNoteRefs) ? xmlNoteRefs : [xmlNoteRefs];
  return noteRefs.map((noteRef) => ({
    targetGUID: noteRef.targetGUID,
  }));
}

/**
 * Converts XML Code elements to CodeType objects
 */
function convertCodes(xmlCodes: any): CodeType[] {
  if (!xmlCodes) return [];

  const codes = Array.isArray(xmlCodes) ? xmlCodes : [xmlCodes];

  return codes.map((code) => {
    const codeObj: CodeType = {
      guid: code.guid,
      name: code.name,
      isCodable: code.isCodable === "true" || code.isCodable === true,
      color: code.color,
    };

    if (code.Description) {
      codeObj.Description = code.Description;
    }

    if (code.NoteRef) {
      codeObj.NoteRef = convertNoteRefs(code.NoteRef);
    }

    if (code.Code) {
      codeObj.Code = convertCodes(code.Code);
    }

    return codeObj;
  });
}

/**
 * Converts XML Variable elements to VariableType objects
 */
function convertVariables(xmlVariables: any): VariableType[] {
  if (!xmlVariables) return [];

  const variables = Array.isArray(xmlVariables) ? xmlVariables : [xmlVariables];

  return variables.map((variable) => {
    const variableObj: VariableType = {
      guid: variable.guid,
      name: variable.name,
      typeOfVariable: variable.typeOfVariable,
    };

    if (variable.Description) {
      variableObj.Description = variable.Description;
    }

    return variableObj;
  });
}

/**
 * Converts XML VariableValue elements to VariableValueType objects
 */
function convertVariableValues(xmlVariableValues: any): VariableValueType[] {
  if (!xmlVariableValues) return [];

  const values = Array.isArray(xmlVariableValues) ? xmlVariableValues : [xmlVariableValues];

  return values.map((value) => {
    const valueObj: VariableValueType = {
      VariableRef: {
        targetGUID: value.VariableRef.targetGUID,
      },
    };

    // Add value based on type
    if (value.TextValue !== undefined) {
      valueObj.TextValue = value.TextValue;
    } else if (value.BooleanValue !== undefined) {
      valueObj.BooleanValue = value.BooleanValue === "true" || value.BooleanValue === true;
    } else if (value.IntegerValue !== undefined) {
      valueObj.IntegerValue = parseInt(value.IntegerValue, 10);
    } else if (value.FloatValue !== undefined) {
      valueObj.FloatValue = parseFloat(value.FloatValue);
    } else if (value.DateValue !== undefined) {
      valueObj.DateValue = value.DateValue;
    } else if (value.DateTimeValue !== undefined) {
      valueObj.DateTimeValue = value.DateTimeValue;
    }

    return valueObj;
  });
}

/**
 * Converts XML Case elements to CaseType objects
 */
function convertCases(xmlCases: any): CaseType[] {
  if (!xmlCases) return [];

  const cases = Array.isArray(xmlCases) ? xmlCases : [xmlCases];

  return cases.map((caseItem) => {
    const caseObj: CaseType = {
      guid: caseItem.guid,
      name: caseItem.name,
    };

    if (caseItem.Description) {
      caseObj.Description = caseItem.Description;
    }

    if (caseItem.CodeRef) {
      caseObj.CodeRef = convertCodeRefs(caseItem.CodeRef);
    }

    if (caseItem.VariableValue) {
      caseObj.VariableValue = convertVariableValues(caseItem.VariableValue);
    }

    if (caseItem.SourceRef) {
      caseObj.SourceRef = convertSourceRefs(caseItem.SourceRef);
    }

    if (caseItem.SelectionRef) {
      caseObj.SelectionRef = convertSelectionRefs(caseItem.SelectionRef);
    }

    return caseObj;
  });
}

/**
 * Converts XML Sources elements to the Sources object
 */
function convertSources(xmlSources: any): any {
  const sources: any = {};

  // Process each source type
  if (xmlSources.TextSource) {
    sources.TextSource = convertTextSources(xmlSources.TextSource);
  }

  if (xmlSources.PictureSource) {
    sources.PictureSource = convertPictureSources(xmlSources.PictureSource);
  }

  if (xmlSources.PDFSource) {
    sources.PDFSource = convertPDFSources(xmlSources.PDFSource);
  }

  if (xmlSources.AudioSource) {
    sources.AudioSource = convertAudioSources(xmlSources.AudioSource);
  }

  if (xmlSources.VideoSource) {
    sources.VideoSource = convertVideoSources(xmlSources.VideoSource);
  }

  return sources;
}

/**
 * Converts XML TextSource elements to TextSourceType objects
 */
function convertTextSources(xmlTextSources: any): TextSourceType[] {
  if (!xmlTextSources) return [];

  const sources = Array.isArray(xmlTextSources) ? xmlTextSources : [xmlTextSources];

  return sources.map((source) => {
    const sourceObj: TextSourceType = {
      guid: source.guid,
      name: source.name,
      richTextPath: source.richTextPath,
      plainTextPath: source.plainTextPath,
      creatingUser: source.creatingUser,
      creationDateTime: source.creationDateTime,
      modifyingUser: source.modifyingUser,
      modifiedDateTime: source.modifiedDateTime,
    };

    if (source.Description) {
      sourceObj.Description = source.Description;
    }

    if (source.PlainTextContent) {
      sourceObj.PlainTextContent = source.PlainTextContent;
    }

    if (source.PlainTextSelection) {
      sourceObj.PlainTextSelection = convertPlainTextSelections(source.PlainTextSelection);
    }

    if (source.Coding) {
      sourceObj.Coding = convertCodings(source.Coding);
    }

    if (source.NoteRef) {
      sourceObj.NoteRef = convertNoteRefs(source.NoteRef);
    }

    if (source.VariableValue) {
      sourceObj.VariableValue = convertVariableValues(source.VariableValue);
    }

    return sourceObj;
  });
}

/**
 * Converts XML PictureSource elements to PictureSourceType objects
 */
function convertPictureSources(xmlPictureSources: any): PictureSourceType[] {
  if (!xmlPictureSources) return [];

  const sources = Array.isArray(xmlPictureSources) ? xmlPictureSources : [xmlPictureSources];

  return sources.map((source) => {
    const sourceObj: PictureSourceType = {
      guid: source.guid,
      name: source.name,
      path: source.path,
      currentPath: source.currentPath,
      creatingUser: source.creatingUser,
      creationDateTime: source.creationDateTime,
      modifyingUser: source.modifyingUser,
      modifiedDateTime: source.modifiedDateTime,
    };

    if (source.Description) {
      sourceObj.Description = source.Description;
    }

    if (source.TextDescription) {
      sourceObj.TextDescription = convertTextSources(source.TextDescription)[0];
    }

    if (source.PictureSelection) {
      sourceObj.PictureSelection = convertPictureSelections(source.PictureSelection);
    }

    if (source.Coding) {
      sourceObj.Coding = convertCodings(source.Coding);
    }

    if (source.NoteRef) {
      sourceObj.NoteRef = convertNoteRefs(source.NoteRef);
    }

    if (source.VariableValue) {
      sourceObj.VariableValue = convertVariableValues(source.VariableValue);
    }

    return sourceObj;
  });
}

/**
 * Converts XML PDFSource elements to PDFSourceType objects
 */
function convertPDFSources(xmlPDFSources: any): PDFSourceType[] {
  if (!xmlPDFSources) return [];

  const sources = Array.isArray(xmlPDFSources) ? xmlPDFSources : [xmlPDFSources];

  return sources.map((source) => {
    const sourceObj: PDFSourceType = {
      guid: source.guid,
      name: source.name,
      path: source.path,
      currentPath: source.currentPath,
      creatingUser: source.creatingUser,
      creationDateTime: source.creationDateTime,
      modifyingUser: source.modifyingUser,
      modifiedDateTime: source.modifiedDateTime,
    };

    if (source.Description) {
      sourceObj.Description = source.Description;
    }

    if (source.PDFSelection) {
      sourceObj.PDFSelection = convertPDFSelections(source.PDFSelection);
    }

    if (source.Representation) {
      sourceObj.Representation = convertTextSources(source.Representation)[0];
    }

    if (source.Coding) {
      sourceObj.Coding = convertCodings(source.Coding);
    }

    if (source.NoteRef) {
      sourceObj.NoteRef = convertNoteRefs(source.NoteRef);
    }

    if (source.VariableValue) {
      sourceObj.VariableValue = convertVariableValues(source.VariableValue);
    }

    return sourceObj;
  });
}

/**
 * Converts XML AudioSource elements to AudioSourceType objects
 */
function convertAudioSources(xmlAudioSources: any): AudioSourceType[] {
  if (!xmlAudioSources) return [];

  const sources = Array.isArray(xmlAudioSources) ? xmlAudioSources : [xmlAudioSources];

  return sources.map((source) => {
    const sourceObj: AudioSourceType = {
      guid: source.guid,
      name: source.name,
      path: source.path,
      currentPath: source.currentPath,
      creatingUser: source.creatingUser,
      creationDateTime: source.creationDateTime,
      modifyingUser: source.modifyingUser,
      modifiedDateTime: source.modifiedDateTime,
    };

    if (source.Description) {
      sourceObj.Description = source.Description;
    }

    if (source.Transcript) {
      sourceObj.Transcript = convertTranscripts(source.Transcript);
    }

    if (source.AudioSelection) {
      sourceObj.AudioSelection = convertAudioSelections(source.AudioSelection);
    }

    if (source.Coding) {
      sourceObj.Coding = convertCodings(source.Coding);
    }

    if (source.NoteRef) {
      sourceObj.NoteRef = convertNoteRefs(source.NoteRef);
    }

    if (source.VariableValue) {
      sourceObj.VariableValue = convertVariableValues(source.VariableValue);
    }

    return sourceObj;
  });
}

/**
 * Converts XML VideoSource elements to VideoSourceType objects
 */
function convertVideoSources(xmlVideoSources: any): VideoSourceType[] {
  if (!xmlVideoSources) return [];

  const sources = Array.isArray(xmlVideoSources) ? xmlVideoSources : [xmlVideoSources];

  return sources.map((source) => {
    const sourceObj: VideoSourceType = {
      guid: source.guid,
      name: source.name,
      path: source.path,
      currentPath: source.currentPath,
      creatingUser: source.creatingUser,
      creationDateTime: source.creationDateTime,
      modifyingUser: source.modifyingUser,
      modifiedDateTime: source.modifiedDateTime,
    };

    if (source.Description) {
      sourceObj.Description = source.Description;
    }

    if (source.Transcript) {
      sourceObj.Transcript = convertTranscripts(source.Transcript);
    }

    if (source.VideoSelection) {
      sourceObj.VideoSelection = convertVideoSelections(source.VideoSelection);
    }

    if (source.Coding) {
      sourceObj.Coding = convertCodings(source.Coding);
    }

    if (source.NoteRef) {
      sourceObj.NoteRef = convertNoteRefs(source.NoteRef);
    }

    if (source.VariableValue) {
      sourceObj.VariableValue = convertVariableValues(source.VariableValue);
    }

    return sourceObj;
  });
}

/**
 * Converts XML PlainTextSelection elements to PlainTextSelectionType objects
 */
function convertPlainTextSelections(xmlSelections: any): PlainTextSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: PlainTextSelectionType = {
      guid: selection.guid,
      name: selection.name,
      startPosition: parseInt(selection.startPosition, 10),
      endPosition: parseInt(selection.endPosition, 10),
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML PictureSelection elements to PictureSelectionType objects
 */
function convertPictureSelections(xmlSelections: any): PictureSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: PictureSelectionType = {
      guid: selection.guid,
      name: selection.name,
      firstX: parseInt(selection.firstX, 10),
      firstY: parseInt(selection.firstY, 10),
      secondX: parseInt(selection.secondX, 10),
      secondY: parseInt(selection.secondY, 10),
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML PDFSelection elements to PDFSelectionType objects
 */
function convertPDFSelections(xmlSelections: any): PDFSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: PDFSelectionType = {
      guid: selection.guid,
      name: selection.name,
      page: parseInt(selection.page, 10),
      firstX: parseInt(selection.firstX, 10),
      firstY: parseInt(selection.firstY, 10),
      secondX: parseInt(selection.secondX, 10),
      secondY: parseInt(selection.secondY, 10),
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Representation) {
      selectionObj.Representation = convertTextSources(selection.Representation)[0];
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML AudioSelection elements to AudioSelectionType objects
 */
function convertAudioSelections(xmlSelections: any): AudioSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: AudioSelectionType = {
      guid: selection.guid,
      name: selection.name,
      begin: parseInt(selection.begin, 10),
      end: parseInt(selection.end, 10),
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML VideoSelection elements to VideoSelectionType objects
 */
function convertVideoSelections(xmlSelections: any): VideoSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: VideoSelectionType = {
      guid: selection.guid,
      name: selection.name,
      begin: parseInt(selection.begin, 10),
      end: parseInt(selection.end, 10),
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML Transcript elements to TranscriptType objects
 */
function convertTranscripts(xmlTranscripts: any): TranscriptType[] {
  if (!xmlTranscripts) return [];

  const transcripts = Array.isArray(xmlTranscripts) ? xmlTranscripts : [xmlTranscripts];

  return transcripts.map((transcript) => {
    const transcriptObj: TranscriptType = {
      guid: transcript.guid,
      name: transcript.name,
      richTextPath: transcript.richTextPath,
      plainTextPath: transcript.plainTextPath,
      creatingUser: transcript.creatingUser,
      creationDateTime: transcript.creationDateTime,
      modifyingUser: transcript.modifyingUser,
      modifiedDateTime: transcript.modifiedDateTime,
    };

    if (transcript.Description) {
      transcriptObj.Description = transcript.Description;
    }

    if (transcript.PlainTextContent) {
      transcriptObj.PlainTextContent = transcript.PlainTextContent;
    }

    if (transcript.SyncPoint) {
      transcriptObj.SyncPoint = convertSyncPoints(transcript.SyncPoint);
    }

    if (transcript.TranscriptSelection) {
      transcriptObj.TranscriptSelection = convertTranscriptSelections(transcript.TranscriptSelection);
    }

    if (transcript.NoteRef) {
      transcriptObj.NoteRef = convertNoteRefs(transcript.NoteRef);
    }

    return transcriptObj;
  });
}

/**
 * Converts XML SyncPoint elements to SyncPointType objects
 */
function convertSyncPoints(xmlSyncPoints: any): SyncPointType[] {
  if (!xmlSyncPoints) return [];

  const syncPoints = Array.isArray(xmlSyncPoints) ? xmlSyncPoints : [xmlSyncPoints];

  return syncPoints.map((syncPoint) => {
    return {
      guid: syncPoint.guid,
      timeStamp: syncPoint.timeStamp !== undefined ? parseInt(syncPoint.timeStamp, 10) : undefined,
      position: syncPoint.position !== undefined ? parseInt(syncPoint.position, 10) : undefined,
    };
  });
}

/**
 * Converts XML TranscriptSelection elements to TranscriptSelectionType objects
 */
function convertTranscriptSelections(xmlSelections: any): TranscriptSelectionType[] {
  if (!xmlSelections) return [];

  const selections = Array.isArray(xmlSelections) ? xmlSelections : [xmlSelections];

  return selections.map((selection) => {
    const selectionObj: TranscriptSelectionType = {
      guid: selection.guid,
      name: selection.name,
      fromSyncPoint: selection.fromSyncPoint,
      toSyncPoint: selection.toSyncPoint,
      creatingUser: selection.creatingUser,
      creationDateTime: selection.creationDateTime,
      modifyingUser: selection.modifyingUser,
      modifiedDateTime: selection.modifiedDateTime,
    };

    if (selection.Description) {
      selectionObj.Description = selection.Description;
    }

    if (selection.Coding) {
      selectionObj.Coding = convertCodings(selection.Coding);
    }

    if (selection.NoteRef) {
      selectionObj.NoteRef = convertNoteRefs(selection.NoteRef);
    }

    return selectionObj;
  });
}

/**
 * Converts XML Coding elements to CodingType objects
 */
function convertCodings(xmlCodings: any): CodingType[] {
  if (!xmlCodings) return [];

  const codings = Array.isArray(xmlCodings) ? xmlCodings : [xmlCodings];

  return codings.map((coding) => {
    const codingObj: CodingType = {
      guid: coding.guid,
      creatingUser: coding.creatingUser,
      creationDateTime: coding.creationDateTime,
      CodeRef: {
        targetGUID: coding.CodeRef.targetGUID,
      },
    };

    if (coding.NoteRef) {
      codingObj.NoteRef = convertNoteRefs(coding.NoteRef);
    }

    return codingObj;
  });
}

/**
 * Converts XML Note elements to TextSourceType objects
 */
function convertNotes(xmlNotes: any): TextSourceType[] {
  if (!xmlNotes) return [];

  return convertTextSources(xmlNotes);
}

/**
 * Converts XML Set elements to SetType objects
 */
function convertSets(xmlSets: any): SetType[] {
  if (!xmlSets) return [];

  const sets = Array.isArray(xmlSets) ? xmlSets : [xmlSets];

  return sets.map((set) => {
    const setObj: SetType = {
      guid: set.guid,
      name: set.name,
    };

    if (set.Description) {
      setObj.Description = set.Description;
    }

    if (set.MemberCode) {
      setObj.MemberCode = convertCodeRefs(set.MemberCode);
    }

    if (set.MemberSource) {
      setObj.MemberSource = convertSourceRefs(set.MemberSource);
    }

    if (set.MemberNote) {
      setObj.MemberNote = convertNoteRefs(set.MemberNote);
    }

    return setObj;
  });
}

/**
 * Converts XML Graph elements to GraphType objects
 */
function convertGraphs(xmlGraphs: any): GraphType[] {
  if (!xmlGraphs) return [];

  const graphs = Array.isArray(xmlGraphs) ? xmlGraphs : [xmlGraphs];

  return graphs.map((graph) => {
    const graphObj: GraphType = {
      guid: graph.guid,
      name: graph.name,
    };

    if (graph.Vertex) {
      graphObj.Vertex = convertVertices(graph.Vertex);
    }

    if (graph.Edge) {
      graphObj.Edge = convertEdges(graph.Edge);
    }

    return graphObj;
  });
}

/**
 * Converts XML Vertex elements to VertexType objects
 */
function convertVertices(xmlVertices: any): VertexType[] {
  if (!xmlVertices) return [];

  const vertices = Array.isArray(xmlVertices) ? xmlVertices : [xmlVertices];

  return vertices.map((vertex) => {
    const vertexObj: VertexType = {
      guid: vertex.guid,
      representedGUID: vertex.representedGUID,
      name: vertex.name,
      firstX: parseInt(vertex.firstX, 10),
      firstY: parseInt(vertex.firstY, 10),
      shape: vertex.shape,
      color: vertex.color,
    };

    if (vertex.secondX !== undefined) {
      vertexObj.secondX = parseInt(vertex.secondX, 10);
    }

    if (vertex.secondY !== undefined) {
      vertexObj.secondY = parseInt(vertex.secondY, 10);
    }

    return vertexObj;
  });
}

/**
 * Converts XML Edge elements to EdgeType objects
 */
function convertEdges(xmlEdges: any): EdgeType[] {
  if (!xmlEdges) return [];

  const edges = Array.isArray(xmlEdges) ? xmlEdges : [xmlEdges];

  return edges.map((edge) => {
    return {
      guid: edge.guid,
      representedGUID: edge.representedGUID,
      name: edge.name,
      sourceVertex: edge.sourceVertex,
      targetVertex: edge.targetVertex,
      color: edge.color,
      direction: edge.direction,
      lineStyle: edge.lineStyle,
    };
  });
}

/**
 * Converts XML Link elements to LinkType objects
 */
function convertLinks(xmlLinks: any): LinkType[] {
  if (!xmlLinks) return [];

  const links = Array.isArray(xmlLinks) ? xmlLinks : [xmlLinks];

  return links.map((link) => {
    const linkObj: LinkType = {
      guid: link.guid,
      name: link.name,
      direction: link.direction,
      color: link.color,
      originGUID: link.originGUID,
      targetGUID: link.targetGUID,
    };

    if (link.NoteRef) {
      linkObj.NoteRef = convertNoteRefs(link.NoteRef);
    }

    return linkObj;
  });
}

/**
 * Converts XML CodeRef elements to CodeRefType objects
 */
function convertCodeRefs(xmlCodeRefs: any): CodeRefType[] {
  if (!xmlCodeRefs) return [];

  const codeRefs = Array.isArray(xmlCodeRefs) ? xmlCodeRefs : [xmlCodeRefs];

  return codeRefs.map((codeRef) => ({
    targetGUID: codeRef.targetGUID,
  }));
}

/**
 * Converts XML SourceRef elements to SourceRefType objects
 */
function convertSourceRefs(xmlSourceRefs: any): SourceRefType[] {
  if (!xmlSourceRefs) return [];

  const sourceRefs = Array.isArray(xmlSourceRefs) ? xmlSourceRefs : [xmlSourceRefs];

  return sourceRefs.map((sourceRef) => ({
    targetGUID: sourceRef.targetGUID,
  }));
}

/**
 * Converts XML SelectionRef elements to SelectionRefType objects
 */
function convertSelectionRefs(xmlSelectionRefs: any): SelectionRefType[] {
  if (!xmlSelectionRefs) return [];

  const selectionRefs = Array.isArray(xmlSelectionRefs) ? xmlSelectionRefs : [xmlSelectionRefs];

  return selectionRefs.map((selectionRef) => ({
    targetGUID: selectionRef.targetGUID,
  }));
}
