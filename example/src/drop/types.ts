import type {FileItemProps} from '@/file/item';

export interface Drop {
  id: string;
  name: string;
  size: string;
  privacy: DropPrivacy;
  description?: string;
  expiresAt?: Date;
  limit?: string;
  files: FileItemProps[];
}

export type DropPrivacy =
  | 'public'
  | 'private';
