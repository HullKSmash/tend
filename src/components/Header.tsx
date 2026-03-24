interface HeaderProps {
  bookmarkCount: number;
}

export default function Header({ bookmarkCount }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">Tend</span>
          <span className="header-tagline">Give back to the places you love</span>
        </div>
        {bookmarkCount > 0 && (
          <div className="header-bookmarks">
            <span className="header-heart">♥</span>
            <span className="header-bookmark-count">{bookmarkCount}</span>
            <span className="header-bookmark-label">saved</span>
          </div>
        )}
      </div>
    </header>
  );
}
