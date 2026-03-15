interface EmptyStateProps {
  showBookmarksOnly: boolean;
}

export default function EmptyState({ showBookmarksOnly }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{showBookmarksOnly ? '♡' : '🔍'}</div>
      <h3 className="empty-state-heading">
        {showBookmarksOnly ? 'No saved opportunities yet' : 'No matches found'}
      </h3>
      <p className="empty-state-text">
        {showBookmarksOnly
          ? 'Heart an opportunity to save it for later.'
          : 'Try adjusting your filters or selecting different interests.'}
      </p>
    </div>
  );
}
