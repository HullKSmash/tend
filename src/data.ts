import type { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'trails',    label: 'Trails & Parks',          color: 'var(--tag-trails)'    },
  { id: 'habitat',   label: 'Habitat & Restoration',   color: 'var(--tag-habitat)'   },
  { id: 'cleanup',   label: 'Cleanup',                 color: 'var(--tag-cleanup)'   },
  { id: 'wildlife',  label: 'Wildlife',                color: 'var(--tag-wildlife)'  },
  { id: 'water',     label: 'Water & Coast',           color: 'var(--tag-water)'     },
  { id: 'education', label: 'Environmental Education', color: 'var(--tag-education)' },
];
