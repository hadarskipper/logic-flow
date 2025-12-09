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
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom diamond node for condition nodes
const DiamondNode = ({ data }: { data: any }) => {
  return (
    <div
      style={{
        width: '180px',
        height: '100px',
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(45deg)',
        borderRadius: '8px',
      }}
    >
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
          {data.nodeType}
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
}

function FlowGraphInner({ treeData }: FlowGraphProps) {
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

      // For condition nodes, add both true_node and false_node
      if (node.type === 'condition') {
        if (nodeConfig.true_node && !nodeLevel.has(nodeConfig.true_node)) {
          nodeLevel.set(nodeConfig.true_node, level + 1);
          queue.push({ nodeId: nodeConfig.true_node, level: level + 1 });
        }
        if (nodeConfig.false_node && !nodeLevel.has(nodeConfig.false_node)) {
          nodeLevel.set(nodeConfig.false_node, level + 1);
          queue.push({ nodeId: nodeConfig.false_node, level: level + 1 });
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
                  {node.type}
                </div>
              </div>
            ),
          },
          style: nodeStyle,
        });
      }
    });

    // Create edges
    Object.keys(treeNodes).forEach((nodeId) => {
      const node = treeNodes[nodeId];
      const nodeConfig = node.node_config || {};

      if (node.type === 'condition') {
        if (nodeConfig.true_node) {
          newEdges.push({
            id: `${nodeId}-${nodeConfig.true_node}-true`,
            source: nodeId,
            target: nodeConfig.true_node,
            label: 'Yes',
            labelStyle: { fill: '#10b981', fontWeight: 600 },
            style: { stroke: '#10b981', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#10b981',
            },
          });
        }
        if (nodeConfig.false_node) {
          newEdges.push({
            id: `${nodeId}-${nodeConfig.false_node}-false`,
            source: nodeId,
            target: nodeConfig.false_node,
            label: 'No',
            labelStyle: { fill: '#ef4444', fontWeight: 600 },
            style: { stroke: '#ef4444', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#ef4444',
            },
          });
        }
      } else if (node.next_node) {
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

function FlowGraph({ treeData }: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner treeData={treeData} />
    </ReactFlowProvider>
  );
}

export default FlowGraph;

