export type CoreValue =
  | string
  | number
  | boolean
  | null
  | CoreValue[]
  | { [key: string]: CoreValue };

export type CoreMetadata = Record<string, CoreValue>;
export type CoreStatus = 'active' | 'inactive';
