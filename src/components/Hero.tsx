interface HeroProps {
  totalOpps: number;
  totalOrgs: number;
  savedCount: number;
}

export default function Hero({ totalOpps, totalOrgs, savedCount }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <h1 className="hero-heading">Find volunteer work<br />you'll love</h1>
        <p className="hero-subhead">
          Browse local opportunities by interest, schedule, and location — no account required.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-number">{totalOpps}</span>
            <span className="hero-stat-label">Opportunities</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-number">{totalOrgs}</span>
            <span className="hero-stat-label">Organizations</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-number">{savedCount}</span>
            <span className="hero-stat-label">Saved</span>
          </div>
        </div>
      </div>
    </section>
  );
}
