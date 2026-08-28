import { useState } from 'react';

const TAG_COLORS = ['tag-indigo', 'tag-teal', 'tag-coral', 'tag-amber', 'tag-plum'];

function getTagColor(tag) {
  let hash = 0;
  for (const char of String(tag)) {
    hash = (hash + char.charCodeAt(0)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
}

function TagInput({ tags, onChange }) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const clean = draft.trim();
    if (!clean) return;
    if (tags.includes(clean)) {
      setDraft('');
      return;
    }
    if (tags.length >= 10) {
      setDraft('');
      return;
    }
    onChange([...tags, clean]);
    setDraft('');
  }

  function removeTag(tagToRemove) {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <span key={tag} className={`tag-chip ${getTagColor(tag)}`}>
          {tag}
          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
        aria-label="Add tags"
        className="tag-input-field"
      />
    </div>
  );
}

export default TagInput;
