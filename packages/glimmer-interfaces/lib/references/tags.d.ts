export type Revision = number;

export interface RevisionTag {
  value(): Revision;
  validate(snapshot: Revision): boolean;
}