import { useEffect } from 'react';
import type { Opportunity } from '../types';
import { CATEGORIES } from '../data';

interface DetailDrawerProps {
  opportunity: Opportunity | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
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
  return cat ? cat.color : 'var(--muted)';
}

function getTagLabel(tagId: string): string {
  const cat = CATEGORIES.find(c => c.id === tagId);
  return cat ? cat.label : tagId;
}

export default function DetailDrawer({ opportunity, isBookmarked, onToggleBookmark, onClose }: DetailDrawerProps) {
  const isOpen = opportunity !== null;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const accentVar = opportunity ? `var(--tag-${opportunity.tags[0]})` : 'var(--muted)';

  return (
    <>
      <div
        className={`drawer-backdrop${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`drawer${isOpen ? ' is-open' : ''}`}
        style={{ '--accent': accentVar } as React.CSSProperties}
        aria-label="Opportunity details"
        aria-hidden={!isOpen}
      >
        {opportunity && (
          <>
            <div className="drawer-header">
              <button className="drawer-close-btn" onClick={onClose} aria-label="Close details">
                ✕
              </button>
              <div className="drawer-org-avatar">
                {opportunity.org.charAt(0).toUpperCase()}
              </div>
              <div className="drawer-title-block">
                <h2 className="drawer-title">{opportunity.title}</h2>
                <p className="drawer-org">{opportunity.org}</p>
              </div>
              <button
                className={`bookmark-btn${isBookmarked ? ' is-bookmarked' : ''}`}
                onClick={onToggleBookmark}
                type="button"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this opportunity'}
              >
                {isBookmarked ? '♥' : '♡'}
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-tags">
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
                {opportunity.distance !== undefined && (
                  <span className="distance-badge">{opportunity.distance.toFixed(1)} mi away</span>
                )}
              </div>

              <p className="full-description">{opportunity.fullDescription}</p>

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

              <div className="next-steps-box">
                <p className="next-steps-label">How to get started</p>
                <p className="next-steps">{opportunity.nextSteps}</p>
                {opportunity.website && (
                  <a
                    className="org-website-link"
                    href={opportunity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit their website →
                  </a>
                )}
              </div>

              {opportunity.website && (
                <a
                  className="signup-btn"
                  href={opportunity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </a>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
