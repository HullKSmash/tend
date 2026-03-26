import { useState, useEffect, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import { applyFilters } from './utils/filters';
import { CATEGORIES } from './data';
import type { Opportunity } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import FilterSidebar from './components/FilterSidebar';
import ResultsBar from './components/ResultsBar';
import OpportunityCard from './components/OpportunityCard';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import DetailDrawer from './components/DetailDrawer';
import './App.css';

export default function App() {
  const { state, ...actions } = useAppState();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(setOpportunities)
      .catch(err => console.error('Failed to load opportunities:', err));
  }, []);

  const filtered = useMemo(() => {
    let results = applyFilters(opportunities, state);
    if (state.showBookmarksOnly) {
      results = results.filter(o => state.bookmarks.has(o.id));
    }
    return results;
  }, [opportunities, state]);

  return (
    <div className="app">
      <Header bookmarkCount={state.bookmarks.size} />
      <Hero
        totalOpps={opportunities.length}
        totalOrgs={new Set(opportunities.map(o => o.org)).size}
        savedCount={state.bookmarks.size}
      />
      <div className="page-body">
        <FilterSidebar
          categories={CATEGORIES}
          state={state}
          onToggleTag={actions.toggleTag}
          onSetCommitment={actions.setCommitment}
          onSetDays={actions.setDays}
          onSetRadius={actions.setRadius}
          onSetLocationQuery={actions.setLocationQuery}
        />
        <main className="results">
          <ResultsBar
            count={filtered.length}
            bookmarkCount={state.bookmarks.size}
            showBookmarksOnly={state.showBookmarksOnly}
            onToggleBookmarks={actions.toggleShowBookmarks}
          />
          <div className="cards-grid">
            {filtered.length === 0 ? (
              <EmptyState showBookmarksOnly={state.showBookmarksOnly} />
            ) : (
              filtered.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isBookmarked={state.bookmarks.has(opp.id)}
                  isExpanded={state.expandedId === opp.id}
                  onToggleBookmark={() => actions.toggleBookmark(opp.id)}
                  onToggleExpand={() => actions.toggleExpanded(opp.id)}
                />
              ))
            )}
          </div>
        </main>
      </div>
      <Footer />
      <DetailDrawer
        opportunity={filtered.find(o => o.id === state.expandedId) ?? null}
        isBookmarked={state.expandedId ? state.bookmarks.has(state.expandedId) : false}
        onToggleBookmark={() => state.expandedId && actions.toggleBookmark(state.expandedId)}
        onClose={() => state.expandedId && actions.toggleExpanded(state.expandedId)}
      />
    </div>
  );
}
