export {
  SYNTHESIZED as SYNTHESIZED_LOC,
  SerializedProgram as Program,
  SourceLocation,
  SourceFile,
  Location,
  Position,
  formatLocation,
  HbsToLoc,
  locFromHBS
} from './builders';

//
export interface Child {

}

// Program, Element
export interface Parent {
  children: Child[];
}