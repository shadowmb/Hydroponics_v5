import { MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

// Backend Block Interface (Simplified)
interface Block {
    id: string;
    type: string;
    next?: string;
    params: Record<string, any>;
    position?: { x: number; y: number };
}

interface Program {
    id: string;
    name: string;
    blocks: Block[];
}

/**
 * Converts React Flow Nodes and Edges to a Backend Program structure.
 */
export const flowToProgram = (nodes: Node[], edges: Edge[]): Partial<Program> => {
    const blocks: Block[] = nodes.map((node) => {
        const block: Block = {
            id: node.id,
            type: (node.data.type as string) || 'UNKNOWN',
            params: { ...node.data }, // Copy all data as params initially
            position: node.position,
        };

        // Remove internal React Flow data from params
        delete block.params.label;
        delete block.params.type;

        // Handle Connections (Edges)
        if (block.type === 'IF') {
            // Find True/False paths
            const trueEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'true');
            const falseEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'false');

            if (trueEdge) block.params.trueBlockId = trueEdge.target;
            if (falseEdge) block.params.falseBlockId = falseEdge.target;
        } else {
            // Standard Next path
            const nextEdge = edges.find(e => e.source === node.id);
            if (nextEdge) {
                block.next = nextEdge.target;
            }
        }

        return block;
    });

    return {
        blocks,
    };
};

/**
 * Converts a Backend Program structure to React Flow Nodes and Edges.
 */
export const programToFlow = (program: Partial<Program>): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!program.blocks) return { nodes, edges };

    program.blocks.forEach((block) => {
        // 1. Create Node
        const isCondition = block.type === 'IF';
        const nodeType = isCondition ? 'condition' : 'action'; // Map to custom node types

        // Determine Label
        let label = block.type;
        if (block.params && block.params.label) label = block.params.label;
        else if (block.type === 'ACTUATOR_SET') label = 'Set Actuator';
        else if (block.type === 'SENSOR_READ') label = 'Read Sensor';
        else if (block.type === 'WAIT') label = 'Wait';
        else if (block.type === 'LOG') label = 'Log';

        nodes.push({
            id: block.id,
            type: nodeType, // Use custom type
            position: block.position || { x: 0, y: 0 },
            data: {
                label,
                type: block.type,
                ...block.params
            },
        });

        // 2. Create Edges
        if (block.type === 'IF') {
            if (block.params.trueBlockId) {
                edges.push({
                    id: `e-${block.id}-true-${block.params.trueBlockId}`,
                    source: block.id,
                    target: block.params.trueBlockId,
                    sourceHandle: 'true',
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                });
            }
            if (block.params.falseBlockId) {
                edges.push({
                    id: `e-${block.id}-false-${block.params.falseBlockId}`,
                    source: block.id,
                    target: block.params.falseBlockId,
                    sourceHandle: 'false',
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                });
            }
        } else if (block.next) {
            edges.push({
                id: `e-${block.id}-${block.next}`,
                source: block.id,
                target: block.next,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        }
    });

    return { nodes, edges };
};
