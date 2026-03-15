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

const DAYS_LABELS: Record<string, string> = {
  'weekdays': 'Weekdays',
  'weekends': 'Weekends',
  'either': 'Flexible',
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
      <div className="card-summary">
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
          <span className="commitment-badge">{COMMITMENT_LABELS[opportunity.commitment]}</span>
        </div>

        <p className="card-duration">{opportunity.duration}</p>

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
            aria-label={isExpanded ? 'Collapse details' : 'Show details'}
          >
            <span className="expand-label">{isExpanded ? 'Less info' : 'More info'}</span>
            <span className="expand-chevron">▾</span>
          </button>
        </div>
      </div>

      <div className="card-detail">
        <div className="card-detail-inner">
          {opportunity.distance !== undefined && (
            <div className="distance-badge">
              {opportunity.distance.toFixed(1)} mi away
            </div>
          )}

          <div className="detail-grid">
            <span className="detail-label">Location</span>
            <span className="detail-value">{opportunity.city}, {opportunity.state} {opportunity.zip}</span>
            <span className="detail-label">Commitment</span>
            <span className="detail-value">{COMMITMENT_LABELS[opportunity.commitment]}</span>
            <span className="detail-label">Availability</span>
            <span className="detail-value">{DAYS_LABELS[opportunity.days]}</span>
            <span className="detail-label">Time Required</span>
            <span className="detail-value">{opportunity.duration}</span>
          </div>

          <p className="full-description">{opportunity.fullDescription}</p>

          <div className="contact-box">
            <p className="contact-name">{opportunity.contactName}</p>
            <p className="contact-role">{opportunity.contactRole}</p>
            <a className="contact-link" href={`mailto:${opportunity.contactEmail}`}>
              {opportunity.contactEmail}
            </a>
            <a className="contact-link" href={`tel:${opportunity.contactPhone}`}>
              {opportunity.contactPhone}
            </a>
          </div>

          <p className="next-steps">{opportunity.nextSteps}</p>

          <a
            className="signup-btn"
            href={`mailto:${opportunity.contactEmail}?subject=Volunteer Interest: ${encodeURIComponent(opportunity.title)}`}
          >
            Sign Up
          </a>
        </div>
      </div>
    </article>
  );
}
