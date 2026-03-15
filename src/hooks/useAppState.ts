import { useState, useEffect, useRef } from 'react';
import type { AppState, TagId } from '../types';
import { loadBookmarks, saveBookmarks, toggleBookmark as toggleBookmarkUtil } from '../utils/bookmarks';
import { geocodeLocation } from '../utils/geo';

const initialState: AppState = {
  activeTags: new Set(),
  commitment: 'any',
  days: 'any',
  userLat: null,
  userLng: null,
  radius: 25,
  showBookmarksOnly: false,
  bookmarks: loadBookmarks(),
  expandedId: null,
  locationQuery: '',
  isGeocoding: false,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleTag = (tag: TagId) => {
    setState(prev => {
      const next = new Set(prev.activeTags);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return { ...prev, activeTags: next };
    });
  };

  const setCommitment = (v: AppState['commitment']) => {
    setState(prev => ({ ...prev, commitment: v }));
  };

  const setDays = (v: AppState['days']) => {
    setState(prev => ({ ...prev, days: v }));
  };

  const setRadius = (v: number) => {
    setState(prev => ({ ...prev, radius: v }));
  };

  const toggleBookmark = (id: string) => {
    setState(prev => {
      const next = toggleBookmarkUtil(id, prev.bookmarks);
      saveBookmarks(next);
      return { ...prev, bookmarks: next };
    });
  };

  const toggleExpanded = (id: string) => {
    setState(prev => ({
      ...prev,
      expandedId: prev.expandedId === id ? null : id,
    }));
  };

  const toggleShowBookmarks = () => {
    setState(prev => ({ ...prev, showBookmarksOnly: !prev.showBookmarksOnly }));
  };

  const setLocationQuery = (q: string) => {
    setState(prev => ({ ...prev, locationQuery: q }));
  };

  // Debounced geocoding effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!state.locationQuery.trim()) {
      setState(prev => ({ ...prev, userLat: null, userLng: null, isGeocoding: false }));
      return;
    }

    setState(prev => ({ ...prev, isGeocoding: true }));

    debounceRef.current = setTimeout(async () => {
      const result = await geocodeLocation(state.locationQuery);
      if (result) {
        setState(prev => ({
          ...prev,
          userLat: result.lat,
          userLng: result.lng,
          isGeocoding: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          userLat: null,
          userLng: null,
          isGeocoding: false,
        }));
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state.locationQuery]);

  return {
    state,
    toggleTag,
    setCommitment,
    setDays,
    setRadius,
    toggleBookmark,
    toggleExpanded,
    toggleShowBookmarks,
    setLocationQuery,
  };
}
