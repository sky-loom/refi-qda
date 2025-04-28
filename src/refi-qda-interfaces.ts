/**
 * TypeScript interfaces for REFI-QDA Project Schema
 * Based on REFI-QDA Project.xsd v1.0 (March 18, 2019)
 */

// Simple Types
type GUIDType = string; // Format: "00000000-0000-0000-0000-000000000000" or "{00000000-0000-0000-0000-000000000000}"
type RGBType = string;  // Format: "#RRGGBB" or "#RGB"
type DirectionType = "Associative" | "OneWay" | "Bidirectional";
type TypeOfVariableType = "Text" | "Boolean" | "Integer" | "Float" | "Date" | "DateTime";
type ShapeType = "Person" | "Oval" | "Rectangle" | "RoundedRectangle" | "Star" | "LeftTriangle" | "RightTriangle" | "UpTriangle" | "DownTriangle" | "Note";
type LineStyleType = "dotted" | "dashed" | "solid";

// Reference Types
interface NoteRefType {
  targetGUID: GUIDType;
}

interface CodeRefType {
  targetGUID: GUIDType;
}

interface SourceRefType {
  targetGUID: GUIDType;
}

interface SelectionRefType {
  targetGUID: GUIDType;
}

interface VariableRefType {
  targetGUID: GUIDType;
}

// Project Structure
interface ProjectType {
  Users?: UsersType;
  CodeBook?: CodeBookType;
  Variables?: VariablesType;
  Cases?: CasesType;
  Sources?: SourcesType;
  Notes?: NotesType;
  Links?: LinksType;
  Sets?: SetsType;
  Graphs?: GraphsType;
  Description?: string;
  NoteRef?: NoteRefType[];
  name: string;
  origin?: string;
  creatingUserGUID?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUserGUID?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
  basePath?: string;
}

// Users
interface UsersType {
  User: UserType[];
}

interface UserType {
  guid: GUIDType;
  name?: string;
  id?: string;
}

// CodeBook
interface CodeBookType {
  Codes: CodesType;
}

interface CodesType {
  Code: CodeType[];
}

interface CodeType {
  Description?: string;
  NoteRef?: NoteRefType[];
  Code?: CodeType[]; // Recursive structure for nested codes
  guid: GUIDType;
  name: string;
  isCodable: boolean;
  color?: RGBType;
}

// Cases
interface CasesType {
  Case: CaseType[];
}

interface CaseType {
  Description?: string;
  CodeRef?: CodeRefType[];
  VariableValue?: VariableValueType[];
  SourceRef?: SourceRefType[];
  SelectionRef?: SelectionRefType[];
  guid: GUIDType;
  name?: string;
}

// Variables
interface VariablesType {
  Variable: VariableType[];
}

interface VariableType {
  Description?: string;
  guid: GUIDType;
  name: string;
  typeOfVariable: TypeOfVariableType;
}

interface VariableValueType {
  VariableRef: VariableRefType;
  TextValue?: string;
  BooleanValue?: boolean;
  IntegerValue?: number;
  FloatValue?: number;
  DateValue?: string; // xsd:date
  DateTimeValue?: string; // xsd:dateTime
}

// Sets
interface SetsType {
  Set: SetType[];
}

interface SetType {
  Description?: string;
  MemberCode?: CodeRefType[];
  MemberSource?: SourceRefType[];
  MemberNote?: NoteRefType[];
  guid: GUIDType;
  name: string;
}

// Sources
interface SourcesType {
  TextSource?: TextSourceType[];
  PictureSource?: PictureSourceType[];
  PDFSource?: PDFSourceType[];
  AudioSource?: AudioSourceType[];
  VideoSource?: VideoSourceType[];
}

interface TextSourceType {
  Description?: string;
  PlainTextContent?: string;
  PlainTextSelection?: PlainTextSelectionType[];
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  VariableValue?: VariableValueType[];
  guid: GUIDType;
  name?: string;
  richTextPath?: string;
  plainTextPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface PlainTextSelectionType {
  Description?: string;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  startPosition: number;
  endPosition: number;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface PictureSourceType {
  Description?: string;
  TextDescription?: TextSourceType;
  PictureSelection?: PictureSelectionType[];
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  VariableValue?: VariableValueType[];
  guid: GUIDType;
  name?: string;
  path?: string;
  currentPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface PictureSelectionType {
  Description?: string;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface PDFSourceType {
  Description?: string;
  PDFSelection?: PDFSelectionType[];
  Representation?: TextSourceType;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  VariableValue?: VariableValueType[];
  guid: GUIDType;
  name?: string;
  path?: string;
  currentPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface PDFSelectionType {
  Description?: string;
  Representation?: TextSourceType;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  page: number;
  firstX: number;
  firstY: number;
  secondX: number;
  secondY: number;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface AudioSourceType {
  Description?: string;
  Transcript?: TranscriptType[];
  AudioSelection?: AudioSelectionType[];
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  VariableValue?: VariableValueType[];
  guid: GUIDType;
  name?: string;
  path?: string;
  currentPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface AudioSelectionType {
  Description?: string;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  begin: number;
  end: number;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface VideoSourceType {
  Description?: string;
  Transcript?: TranscriptType[];
  VideoSelection?: VideoSelectionType[];
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  VariableValue?: VariableValueType[];
  guid: GUIDType;
  name?: string;
  path?: string;
  currentPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface VideoSelectionType {
  Description?: string;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  begin: number;
  end: number;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface TranscriptType {
  Description?: string;
  PlainTextContent?: string;
  SyncPoint?: SyncPointType[];
  TranscriptSelection?: TranscriptSelectionType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  richTextPath?: string;
  plainTextPath?: string;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface TranscriptSelectionType {
  Description?: string;
  Coding?: CodingType[];
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  fromSyncPoint?: GUIDType;
  toSyncPoint?: GUIDType;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
  modifyingUser?: GUIDType;
  modifiedDateTime?: string; // xsd:dateTime
}

interface SyncPointType {
  guid: GUIDType;
  timeStamp?: number;
  position?: number;
}

interface CodingType {
  CodeRef: CodeRefType;
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  creatingUser?: GUIDType;
  creationDateTime?: string; // xsd:dateTime
}

// Graphs
interface GraphsType {
  Graph: GraphType[];
}

interface GraphType {
  Vertex?: VertexType[];
  Edge?: EdgeType[];
  guid: GUIDType;
  name?: string;
}

interface VertexType {
  guid: GUIDType;
  representedGUID?: GUIDType;
  name?: string;
  firstX: number;
  firstY: number;
  secondX?: number;
  secondY?: number;
  shape?: ShapeType;
  color?: RGBType;
}

interface EdgeType {
  guid: GUIDType;
  representedGUID?: GUIDType;
  name?: string;
  sourceVertex: GUIDType;
  targetVertex: GUIDType;
  color?: RGBType;
  direction?: DirectionType;
  lineStyle?: LineStyleType;
}

// Notes
interface NotesType {
  Note: TextSourceType[];
}

// Links
interface LinksType {
  Link: LinkType[];
}

interface LinkType {
  NoteRef?: NoteRefType[];
  guid: GUIDType;
  name?: string;
  direction?: DirectionType;
  color?: RGBType;
  originGUID?: GUIDType;
  targetGUID?: GUIDType;
}

// Root interface
interface Project extends ProjectType {
  // Root element properties are all included in ProjectType
}

export {
  Project,
  ProjectType,
  UsersType,
  UserType,
  CodeBookType,
  CodesType,
  CodeType,
  CasesType,
  CaseType,
  VariablesType,
  VariableType,
  VariableValueType,
  SetsType,
  SetType,
  SourcesType,
  TextSourceType,
  PlainTextSelectionType,
  PictureSourceType,
  PictureSelectionType,
  PDFSourceType,
  PDFSelectionType,
  AudioSourceType,
  AudioSelectionType,
  VideoSourceType,
  VideoSelectionType,
  TranscriptType,
  TranscriptSelectionType,
  SyncPointType,
  CodingType,
  GraphsType,
  GraphType,
  VertexType,
  EdgeType,
  NotesType,
  LinksType,
  LinkType,
  NoteRefType,
  CodeRefType,
  SourceRefType,
  SelectionRefType,
  VariableRefType,
  GUIDType,
  RGBType,
  DirectionType,
  TypeOfVariableType,
  ShapeType,
  LineStyleType
};
