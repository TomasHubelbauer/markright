export type Block = {
  tag: string;
  meta: string;
  code: string;
  path?: string;
  mode?: 'create' | 'append' | 'match';
};
