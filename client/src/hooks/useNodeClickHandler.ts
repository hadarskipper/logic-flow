export function useNodeClickHandler(content: string) {
  const handleNodeClick = (nodeId: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea || !content) return;

    // Find the node section in YAML - match "nodeId:" anywhere in the line
    // We'll calculate indentation from the actual line content
    const nodePattern = new RegExp(`${nodeId}:`, 'm');
    const match = content.match(nodePattern);
    
    if (!match) return;

    const lines = content.split('\n');
    const matchIndex = match.index!;
    
    // Find which line contains the match by tracking character positions explicitly
    // This is more deterministic than counting newlines
    function findLineContainingIndex(targetIndex: number): number {
      let currentPos = 0;
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineLength = lines[lineIndex].length;
        const lineStartPos = currentPos;
        const lineEndPos = currentPos + lineLength; // Position at end of this line (before newline)
        
        // Check if targetIndex falls within this line
        // (between start of line and end of line content, not including the newline)
        if (targetIndex >= lineStartPos && targetIndex < lineEndPos + 1) {
          return lineIndex;
        }
        
        // Move to next line: current line + newline character
        currentPos = lineEndPos + 1;
      }
      return -1; // Should not happen if match was found
    }
    
    const startLine = findLineContainingIndex(matchIndex);
    if (startLine === -1) return; // Safety check
    
    // Get the indent level from the actual line content (not from the regex match)
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
        // Empty line - continue to next line (but keep it in selection if it's between node properties)
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
    
    // Calculate character positions by building them from lines
    // This is clearer than separate position calculations
    function calculatePositionUpToLine(lineIndex: number, includeLineContent: boolean): number {
      let pos = 0;
      const endIndex = includeLineContent ? lineIndex + 1 : lineIndex;
      
      for (let i = 0; i < endIndex; i++) {
        if (i < lines.length) {
          pos += lines[i].length;
          // Add newline after each line except the last line of content
          if (i < lines.length - 1) {
            pos += 1;
          }
        }
      }
      
      return pos;
    }
    
    // Start position: beginning of the startLine
    const startPos = calculatePositionUpToLine(startLine, false);
    
    // End position: end of the last line in the selection (endLine is exclusive)
    const endPos = calculatePositionUpToLine(endLine, false);
    
    // Select and scroll to the text
    textarea.focus();
    textarea.setSelectionRange(startPos, endPos);
    
    // Scroll the textarea to show the selected text
    const lineHeight = 20; // Approximate line height
    textarea.scrollTop = startLine * lineHeight - textarea.clientHeight / 2;
  };

  return handleNodeClick;
}

