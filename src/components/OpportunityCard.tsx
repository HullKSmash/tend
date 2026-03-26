import type { Opportunity } from '../types';
import { CATEGORIES } from '../data';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isBookmarked: boolean;
  isExpanded: boolean;
  onToggleBookmark: () => void;
  onToggleExpand: () => void;
}


const COMMITMENT_LABELS: Record<string, string> = {
  'one-time': 'One-time',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
  'flexible': 'Flexible',
};


function getTagColor(tagId: string): string {
  const cat = CATEGORIES.find(c => c.id === tagId);
  return cat ? cat.color : 'var(--tag-community)';
}

function getTagLabel(tagId: string): string {
  const cat = CATEGORIES.find(c => c.id === tagId);
  return cat ? cat.label : tagId;
}

export default function OpportunityCard({
  opportunity,
  isBookmarked,
  isExpanded,
  onToggleBookmark,
  onToggleExpand,
}: OpportunityCardProps) {
  const accentVar = `var(--tag-${opportunity.tags[0]})`;
  const orgInitial = opportunity.org.charAt(0).toUpperCase();

  return (
    <article
      className={`card${isBookmarked ? ' is-bookmarked' : ''}${isExpanded ? ' is-expanded' : ''}`}
      style={{ '--accent': accentVar } as React.CSSProperties}
    >
      <div className="card-header-row">
        <div className="org-avatar">{orgInitial}</div>
        <div className="card-title-block">
          <h3 className="card-title">{opportunity.title}</h3>
          <p className="card-org">{opportunity.org}</p>
        </div>
        <div className="location-pill">
          <span className="location-pin">📍</span>
          {opportunity.city}, {opportunity.state}
        </div>
      </div>

      <div className="card-tags">
        {opportunity.tags.map(tag => (
          <span
            key={tag}
            className="tag-pill"
            style={{ '--tag-color': getTagColor(tag) } as React.CSSProperties}
          >
            {getTagLabel(tag)}
          </span>
        ))}
      </div>

      <p className="card-duration">
        {COMMITMENT_LABELS[opportunity.commitment]} · {opportunity.duration}
        {opportunity.commitment === 'one-time' && opportunity.eventDate && (
          <> · {opportunity.eventDate}</>
        )}
      </p>
      <p className="card-description">{opportunity.description}</p>

      <div className="card-action-row">
        <button
          className={`bookmark-btn${isBookmarked ? ' is-bookmarked' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleBookmark(); }}
          type="button"
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this opportunity'}
        >
          {isBookmarked ? '♥' : '♡'}
          <span className="bookmark-btn-label">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
        <button
          className="expand-btn"
          onClick={onToggleExpand}
          type="button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Close details' : 'Show details'}
        >
          <span className="expand-label">More info</span>
          <span className="expand-chevron">›</span>
        </button>
      </div>
    </article>
  );
}
