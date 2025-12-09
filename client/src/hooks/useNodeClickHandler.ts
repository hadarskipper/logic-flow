export function useNodeClickHandler(content: string) {
  const handleNodeClick = (nodeId: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea || !content) return;

    // Find the node section in YAML - look for "  nodeId:" (with indentation under nodes:)
    const nodePattern = new RegExp(`^\\s{2,}${nodeId}:\\s*$`, 'm');
    const match = content.match(nodePattern);
    
    if (!match) return;

    const lines = content.split('\n');
    
    // Find the line number where the node starts
    let startLine = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (match.index! >= charCount && match.index! < charCount + lines[i].length + 1) {
        startLine = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    
    // Get the indent level of the nodeId line
    const nodeLine = lines[startLine];
    const nodeIndentMatch = nodeLine.match(/^(\s*)/);
    const nodeIndent = nodeIndentMatch ? nodeIndentMatch[1].length : 0;
    
    // Find the end of this node's definition
    // It ends when we hit another node at the same indent level or go up in hierarchy
    let endLine = startLine + 1;
    
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed === '') {
        // Empty line - continue to next line
        endLine = i + 1;
        continue;
      }
      
      const lineIndentMatch = line.match(/^(\s*)/);
      const lineIndent = lineIndentMatch ? lineIndentMatch[1].length : 0;
      
      // If we've gone up in hierarchy (less indent), we're past this node
      if (lineIndent < nodeIndent) {
        endLine = i;
        break;
      }
      
      // If we find a line at same indent that looks like another node key
      if (lineIndent === nodeIndent && trimmed.match(/^\w+:\s*$/)) {
        endLine = i;
        break;
      }
      
      // Continue including this line in the selection
      endLine = i + 1;
    }
    
    // Calculate start position - beginning of the nodeId line
    let startPos = 0;
    for (let i = 0; i < startLine; i++) {
      startPos += lines[i].length + 1; // +1 for newline
    }
    
    // Calculate end position - end of the last line of the node definition
    let endPos = startPos;
    // Add all lines from startLine to endLine (exclusive of endLine)
    for (let i = startLine; i < endLine; i++) {
      endPos += lines[i].length;
      // Add newline after each line (if there's a next line, either in selection or after)
      if (i < endLine - 1) {
        // There's another line in the selection
        endPos += 1;
      } else if (i === endLine - 1 && endLine < lines.length) {
        // This is the last selected line, but there's more content after
        endPos += 1;
      }
    }
    
    // Select and scroll to the text
    textarea.focus();
    textarea.setSelectionRange(startPos, endPos);
    
    // Scroll the textarea to show the selected text
    const lineHeight = 20; // Approximate line height
    textarea.scrollTop = startLine * lineHeight - textarea.clientHeight / 2;
  };

  return handleNodeClick;
}

