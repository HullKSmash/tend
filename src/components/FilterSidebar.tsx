import type { Category, AppState, TagId } from '../types';

interface FilterSidebarProps {
  categories: Category[];
  state: AppState;
  onToggleTag: (tag: TagId) => void;
  onSetCommitment: (v: AppState['commitment']) => void;
  onSetDays: (v: AppState['days']) => void;
  onSetRadius: (v: number) => void;
  onSetLocationQuery: (q: string) => void;
}

export default function FilterSidebar({
  categories,
  state,
  onToggleTag,
  onSetCommitment,
  onSetDays,
  onSetRadius,
  onSetLocationQuery,
}: FilterSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="filter-section">
        <h2 className="filter-heading">Interests</h2>
        <div className="tag-buttons">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`tag-btn${state.activeTags.has(cat.id) ? ' is-active' : ''}`}
              style={{ '--accent': cat.color } as React.CSSProperties}
              onClick={() => onToggleTag(cat.id)}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h2 className="filter-heading">Commitment</h2>
        <select
          className="filter-select"
          value={state.commitment}
          onChange={e => onSetCommitment(e.target.value as AppState['commitment'])}
        >
          <option value="any">Any commitment</option>
          <option value="one-time">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      <div className="filter-section">
        <h2 className="filter-heading">Availability</h2>
        <select
          className="filter-select"
          value={state.days}
          onChange={e => onSetDays(e.target.value as AppState['days'])}
        >
          <option value="any">Any days</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
          <option value="either">Either / flexible</option>
        </select>
      </div>

      <div className="filter-section">
        <h2 className="filter-heading">Location</h2>
        <div className={`location-input-wrapper${state.isGeocoding ? ' is-loading' : ''}`}>
          <input
            className="filter-input"
            type="text"
            placeholder="ZIP code or city name"
            value={state.locationQuery}
            onChange={e => onSetLocationQuery(e.target.value)}
          />
        </div>
        {state.userLat !== null && (
          <p className="location-found">Location found</p>
        )}
        <label className="filter-label-small" htmlFor="radius-select">
          Search radius
        </label>
        <select
          id="radius-select"
          className="filter-select"
          value={state.radius}
          onChange={e => onSetRadius(Number(e.target.value))}
          disabled={state.userLat === null}
        >
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
          <option value={25}>25 miles</option>
          <option value={50}>50 miles</option>
        </select>
      </div>
    </aside>
  );
}
