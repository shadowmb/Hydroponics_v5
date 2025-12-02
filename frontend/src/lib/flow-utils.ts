import { MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

// Backend Block Interface
interface Block {
    id: string;
    type: string;
    params: Record<string, any>;
    position?: { x: number; y: number };
}

// Backend Edge Interface
interface BackendEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    animated?: boolean;
    label?: string;
}

interface Program {
    id: string;
    name: string;
    nodes: Block[];
    edges: BackendEdge[];
}

/**
 * Converts React Flow Nodes and Edges to a Backend Program structure.
 */
export const flowToProgram = (nodes: Node[], edges: Edge[]): Partial<Program> => {
    const backendNodes: Block[] = nodes.map((node) => {
        const block: Block = {
            id: node.id,
            type: (node.data.type as string) || 'UNKNOWN',
            params: { ...node.data },
            position: node.position,
        };

        // Remove internal React Flow data from params
        delete block.params.label;
        delete block.params.type;

        return block;
    });

    const backendEdges: BackendEdge[] = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
        type: edge.type,
        animated: edge.animated,
        label: (edge.label as string) || undefined,
    }));

    return {
        nodes: backendNodes,
        edges: backendEdges,
    };
};

/**
 * Converts a Backend Program structure to React Flow Nodes and Edges.
 */
export const programToFlow = (program: Partial<Program>): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!program.nodes) return { nodes, edges };

    program.nodes.forEach((block) => {
        // 1. Create Node
        const isCondition = block.type === 'IF';
        const nodeType = isCondition ? 'condition' : 'generic'; // Use generic for all standard blocks

        // Determine Label
        let label = block.type;
        if (block.params && block.params.label) label = block.params.label;
        else if (block.type === 'ACTUATOR_SET') label = 'Set Actuator';
        else if (block.type === 'SENSOR_READ') label = 'Read Sensor';
        else if (block.type === 'WAIT') label = 'Wait';
        else if (block.type === 'LOG') label = 'Log';

        nodes.push({
            id: block.id,
            type: nodeType,
            position: block.position || { x: 0, y: 0 },
            data: {
                label,
                type: block.type,
                ...block.params
            },
        });
    });

    if (program.edges) {
        program.edges.forEach((edge) => {
            edges.push({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                type: edge.type || 'smoothstep',
                animated: edge.animated,
                label: edge.label,
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        });
    }

    return { nodes, edges };
};
