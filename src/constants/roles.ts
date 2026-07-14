export const DOCUMENT_ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type DocumentRole = typeof DOCUMENT_ROLES[keyof typeof DOCUMENT_ROLES];
