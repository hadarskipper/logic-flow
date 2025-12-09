import { Message } from '../types';

interface EditSectionProps {
  title: string;
  content: string;
  loading: boolean;
  message: Message | null;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCommit: () => void;
}

export default function EditSection({
  title,
  content,
  loading,
  message,
  onTitleChange,
  onContentChange,
  onCommit,
}: EditSectionProps) {
  return (
    <div className="form-column form-column-left">
      <h2 className="column-title">Edit</h2>
      <div className="form-group">
        <label htmlFor="title">Commit Title:</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter commit message..."
          className="title-input"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="content">Code Content:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter your code here..."
          className="content-textarea"
          disabled={loading}
        />
      </div>

      <button 
        onClick={onCommit} 
        disabled={loading || !title.trim() || !content.trim()}
        className="commit-button"
      >
        {loading ? 'Committing...' : 'Commit to logic.yaml'}
      </button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

