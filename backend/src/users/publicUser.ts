import { UserRow } from './repo';

export interface PublicUser {
  id: string;
  email: string | null;
  isGuest: boolean;
  birthYear: number | null;
  interests: string[];
  characterLook: string | null;
  characterName: string | null;
  notificationsOptIn: boolean | null;
  createdAt: Date;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    isGuest: row.is_guest,
    birthYear: row.birth_year,
    interests: row.interests,
    characterLook: row.character_look,
    characterName: row.character_name,
    notificationsOptIn: row.notifications_opt_in,
    createdAt: row.created_at,
  };
}
