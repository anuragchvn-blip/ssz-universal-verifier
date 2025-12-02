export enum TypeKind {
  Basic = 0,
  Vector = 1,
  List = 2,
  Container = 3,
  Bitlist = 4
}

export interface TypeDesc {
  kind: TypeKind;
  fixedSize?: number;
  elementType?: TypeDesc;
  fieldTypes?: TypeDesc[];
  maxLength?: number;
}

export enum SszError {
  None = 0,
  BadOffset = 1,
  NonCanonical = 2,
  BitlistPadding = 3,
  UnsupportedType = 4,
  MalformedHeader = 5,
  LengthOverflow = 6,
  UnexpectedEOF = 7
}

export interface Range {
  start: number;
  end: number;
}
