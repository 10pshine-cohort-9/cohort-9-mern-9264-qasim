function Sidebar({ activeView, onSelectView, allCount, pinnedCount, tags }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => onSelectView('all')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
          All notes
          <span className="sidebar-count">{allCount}</span>
        </button>
        <button
          type="button"
          className={`sidebar-nav-item ${activeView === 'pinned' ? 'active' : ''}`}
          onClick={() => onSelectView('pinned')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 17v5M9 10.5V6a3 3 0 0 1 6 0v4.5c0 .3.15.5.4.65l1.3.8c.5.3.8.85.8 1.4v.65a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1v-.65c0-.55.3-1.1.8-1.4l1.3-.8c.25-.15.4-.35.4-.65Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
          Pinned
          <span className="sidebar-count">{pinnedCount}</span>
        </button>

        {tags.length > 0 && (
          <>
            <p className="sidebar-section-label">Tags</p>
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.name}
                className={`sidebar-nav-item ${activeView === `tag:${tag.name}` ? 'active' : ''}`}
                onClick={() => onSelectView(`tag:${tag.name}`)}
              >
                <span className={`sidebar-tag-dot ${tag.colorClass}`} aria-hidden="true" />
                {tag.name}
                <span className="sidebar-count">{tag.count}</span>
              </button>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
