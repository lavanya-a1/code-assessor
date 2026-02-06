function TagFilter({ tags, selectedTag, onSelectTag }) {
    return (
        <div className="tag-filter-section">
            <div className="tag-filter-label">Filter by Topic:</div>
            <div className="tag-filter-container">
                <button
                    className={`tag-filter-btn ${selectedTag === 'all' ? 'active' : ''}`}
                    onClick={() => onSelectTag('all')}
                >
                    All
                </button>
                {tags.map((tag) => (
                    <button
                        key={tag}
                        className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => onSelectTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default TagFilter;
