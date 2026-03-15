export type CommitmentType = 'one-time' | 'weekly' | 'monthly' | 'flexible';
export type DaysType = 'weekdays' | 'weekends' | 'either';
export type TagId = 'nature' | 'animals' | 'kids' | 'food' | 'seniors' | 'arts' | 'housing' | 'health' | 'cleanup' | 'civic';

export interface Category {
  id: TagId;
  label: string;
  color: string;
}

export interface Opportunity {
  id: string;
  title: string;
  org: string;
  tags: TagId[];
  commitment: CommitmentType;
  days: DaysType;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  duration: string;
  description: string;
  fullDescription: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  nextSteps: string;
  distance?: number;
}

export interface AppState {
  activeTags: Set<TagId>;
  commitment: 'any' | CommitmentType;
  days: 'any' | DaysType;
  userLat: number | null;
  userLng: number | null;
  radius: number;
  showBookmarksOnly: boolean;
  bookmarks: Set<string>;
  expandedId: string | null;
  locationQuery: string;
  isGeocoding: boolean;
}
