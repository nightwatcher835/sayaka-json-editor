export interface SetData {
  groupId?: number | string | null;
  set_code?: string;
  name?: string;
  [key: string]: any;
}

export interface CardVariant {
  set?: SetData;
  tcgplayerId?: string | number | null;
  justname?: string;
  juSTname?: string;
  printing?: string;
  marketPrice?: number | null;
  price?: number | null;
  variant_code?: string;
  variant_external_id?: string | number;
  [key: string]: any;
}

export interface CardImages {
  small?: string;
  large?: string;
  [key: string]: any;
}

export interface CardDocument {
  _id: string;
  id?: string | number;
  code?: string;
  name?: string;
  images?: CardImages;
  variants?: CardVariant[];
  [key: string]: any;
}

export interface FileMetadata {
  fileName: string;
  fileSizeBytes: number;
  totalCards: number;
  totalVariants: number;
  missingTcgCount: number;
  modifiedCount: number;
  loadedAt: Date;
}

export type ExportFormat = 'json-pretty' | 'json-minified' | 'ndjson-mongo' | 'modified-only';
