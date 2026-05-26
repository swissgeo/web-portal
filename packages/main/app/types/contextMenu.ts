export interface ContextMenuRow {
  label: string;
  labelLink?: string | ((_value: string) => string);
  value: string;
}
