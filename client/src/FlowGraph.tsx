import { useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom diamond node for condition nodes
const DiamondNode = ({ data, id }: { data: any; id: string }) => {
  const size = 120; // Perfect square size
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(45deg)',
        borderRadius: '8px',
        position: 'relative',
      }}
    >
      {/* Connection handles at the corners of the square (before rotation) */}
      {/* Top-left corner (becomes top point after rotation) - target for incoming edges */}
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          position: 'absolute',
          left: 0,
          top: 0,
          right: 'auto',
          bottom: 'auto',
          transform: 'none',
        }} 
      />
      {/* Bottom-right corner (becomes bottom point after rotation) - source for all outgoing edges */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 'auto',
          top: 'auto',
          transform: 'none',
        }} 
      />
      
      <div
        style={{
          transform: 'rotate(-45deg)',
          textAlign: 'center',
          width: '100%',
          padding: '8px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
          {data.nodeName}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {data.nodeType} ({id})
        </div>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  diamond: DiamondNode,
};

interface FlowGraphProps {
  treeData: any;
  onNodeClick?: (nodeId: string) => void;
}

function FlowGraphInner({ treeData, onNodeClick }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    if (!treeData || !treeData.nodes || !treeData.start_node) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const treeNodes = treeData.nodes;
    const startNodeId = treeData.start_node;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Calculate node positions using BFS layout algorithm
    const visited = new Set<string>();
    const levelNodes = new Map<number, string[]>();
    const nodeLevel = new Map<string, number>();

    // BFS to assign levels
    const queue: { nodeId: string; level: number }[] = [{ nodeId: startNodeId, level: 0 }];
    nodeLevel.set(startNodeId, 0);

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (!levelNodes.has(level)) {
        levelNodes.set(level, []);
      }
      levelNodes.get(level)!.push(nodeId);

      const node = treeNodes[nodeId];
      if (!node) continue;

      const nodeConfig = node.node_config || {};

      // For condition nodes, add next_nodes and no_match_node
      if (node.type === 'condition') {
        // Handle next_nodes array
        if (nodeConfig.next_nodes && Array.isArray(nodeConfig.next_nodes)) {
          nodeConfig.next_nodes.forEach((nextNodeId: string) => {
            if (nextNodeId && !nodeLevel.has(nextNodeId)) {
              nodeLevel.set(nextNodeId, level + 1);
              queue.push({ nodeId: nextNodeId, level: level + 1 });
            }
          });
        }
        // Handle no_match_node
        if (nodeConfig.no_match_node && !nodeLevel.has(nodeConfig.no_match_node)) {
          nodeLevel.set(nodeConfig.no_match_node, level + 1);
          queue.push({ nodeId: nodeConfig.no_match_node, level: level + 1 });
        }
      } else if (node.next_node && !nodeLevel.has(node.next_node)) {
        nodeLevel.set(node.next_node, level + 1);
        queue.push({ nodeId: node.next_node, level: level + 1 });
      }
    }

    // Position nodes
    levelNodes.forEach((nodeIds, level) => {
      const xSpacing = 280;
      const ySpacing = 180;
      const startX = -(nodeIds.length - 1) * xSpacing / 2;
      
      nodeIds.forEach((nodeId, index) => {
        nodePositions.set(nodeId, {
          x: startX + index * xSpacing,
          y: level * ySpacing,
        });
      });
    });

    // Create nodes
    Object.keys(treeNodes).forEach((nodeId) => {
      const node = treeNodes[nodeId];
      const position = nodePositions.get(nodeId) || { x: 0, y: 0 };
      
      if (node.type === 'condition') {
        // Diamond node for condition nodes
        newNodes.push({
          id: nodeId,
          type: 'diamond',
          position,
          data: {
            nodeName: node.name || nodeId,
            nodeType: node.type,
            nodeId: nodeId,
          },
        });
      } else {
        // Determine node style based on type
        let nodeStyle: any = {
          background: '#fff',
          border: '2px solid #667eea',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '200px',
        };

        if (node.type === 'exit') {
          nodeStyle = {
            ...nodeStyle,
            border: '2px solid #ef4444',
            background: '#fee2e2',
          };
        } else if (node.type === 'llm') {
          nodeStyle = {
            ...nodeStyle,
            border: '2px solid #8b5cf6',
            background: '#f3e8ff',
          };
        } else if (node.type === 'stt') {
          nodeStyle = {
            ...nodeStyle,
            border: '2px solid #10b981',
            background: '#d1fae5',
          };
        }

        // Default node for other types
        newNodes.push({
          id: nodeId,
          type: 'default',
          position,
          data: {
            label: (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  {node.name || nodeId}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {node.type} ({nodeId})
                </div>
              </div>
            ),
          },
          style: nodeStyle,
        });
      }
    });

    // Create a set of valid node IDs for validation
    const validNodeIds = new Set(Object.keys(treeNodes));

    // Create edges
    Object.keys(treeNodes).forEach((nodeId) => {
      const node = treeNodes[nodeId];
      const nodeConfig = node.node_config || {};

      if (node.type === 'condition') {
        // Handle next_nodes array (match condition)
        if (nodeConfig.next_nodes && Array.isArray(nodeConfig.next_nodes)) {
          nodeConfig.next_nodes.forEach((nextNodeId: string, index: number) => {
            if (nextNodeId && validNodeIds.has(nextNodeId)) {
              newEdges.push({
                id: `${nodeId}-${nextNodeId}-match-${index}`,
                source: nodeId,
                target: nextNodeId,
                label: 'Match',
                labelStyle: { fill: '#10b981', fontWeight: 600 },
                style: { stroke: '#10b981', strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#10b981',
                },
              });
            }
          });
        }
        // Handle no_match_node
        if (nodeConfig.no_match_node && validNodeIds.has(nodeConfig.no_match_node)) {
          newEdges.push({
            id: `${nodeId}-${nodeConfig.no_match_node}-no-match`,
            source: nodeId,
            target: nodeConfig.no_match_node,
            label: 'No Match',
            labelStyle: { fill: '#ef4444', fontWeight: 600 },
            style: { stroke: '#ef4444', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#ef4444',
            },
          });
        }
      } else if (node.next_node && validNodeIds.has(node.next_node)) {
        newEdges.push({
          id: `${nodeId}-${node.next_node}`,
          source: nodeId,
          target: node.next_node,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#667eea',
          },
        });
      }
    });

    // Add start indicator
    const startPosition = nodePositions.get(startNodeId);
    if (startPosition) {
      newNodes.unshift({
        id: 'start',
        type: 'default',
        position: { x: startPosition.x, y: startPosition.y - 100 },
        data: {
          label: (
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#667eea', fontSize: '14px' }}>
              Start
            </div>
          ),
        },
        style: {
          background: '#e0e7ff',
          border: '2px solid #667eea',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

      newEdges.unshift({
        id: 'start-' + startNodeId,
        source: 'start',
        target: startNodeId,
        style: { stroke: '#667eea', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#667eea',
        },
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [treeData, setNodes, setEdges]);

  if (!treeData || !treeData.nodes || !treeData.start_node) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f9fafb',
        borderRadius: '8px',
        color: '#666'
      }}>
        <span>Enter YAML code to see the flow graph...</span>
      </div>
    );
  }

  return (
    <div style={{ height: '400px', width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_event, node) => {
          if (onNodeClick && node.id !== 'start') {
            onNodeClick(node.id);
          }
        }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function FlowGraph({ treeData, onNodeClick }: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner treeData={treeData} onNodeClick={onNodeClick} />
    </ReactFlowProvider>
  );
}

export default FlowGraph;

