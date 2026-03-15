interface ResultsBarProps {
  count: number;
  bookmarkCount: number;
  showBookmarksOnly: boolean;
  onToggleBookmarks: () => void;
}

export default function ResultsBar({
  count,
  bookmarkCount,
  showBookmarksOnly,
  onToggleBookmarks,
}: ResultsBarProps) {
  return (
    <div className="results-bar">
      <p className="results-count">
        Showing <strong>{count}</strong> {count === 1 ? 'opportunity' : 'opportunities'}
      </p>
      <button
        className={`show-saved-btn${showBookmarksOnly ? ' is-active' : ''}`}
        onClick={onToggleBookmarks}
        type="button"
      >
        ♥ Saved{bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}
      </button>
    </div>
  );
}
