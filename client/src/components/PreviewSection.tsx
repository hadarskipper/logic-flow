import FlowGraph from '../FlowGraph';

interface PreviewSectionProps {
  title: string;
  parsedTreeData: any;
  onNodeClick: (nodeId: string) => void;
}

export default function PreviewSection({
  title,
  parsedTreeData,
  onNodeClick,
}: PreviewSectionProps) {
  return (
    <div className="form-column form-column-right">
      <h2 className="column-title">Preview</h2>
      <div className="form-group">
        <label>Commit Title:</label>
        <div className="title-display">
          {title || <span className="placeholder-text">Enter commit message...</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Flow Graph:</label>
        <FlowGraph treeData={parsedTreeData} onNodeClick={onNodeClick} />
      </div>
    </div>
  );
}

