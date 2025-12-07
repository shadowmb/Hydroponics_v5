import type { Node, Edge } from '@xyflow/react';
import { BlockValidationRules } from './FlowValidationRules';

export interface ValidationError {
    blockId: string;
    field?: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    blockErrors: Record<string, ValidationError[]>;
}

export class FlowValidator {
    static validate(nodes: Node[], edges: Edge[], context?: { devices: Map<string, any>, variables: any[], deviceTemplates: any[] }): ValidationResult {
        const errors: ValidationError[] = [];
        const blockErrors: Record<string, ValidationError[]> = {};

        // 1. Validate Blocks
        nodes.forEach(node => {
            const nodeType = node.data.type as string;

            const rules = BlockValidationRules[nodeType];

            // console.log(`Debug Validator:`, { id: node.id, type: nodeType, rules: !!rules, data: node.data });

            if (rules) {
                rules.forEach(rule => {
                    const value = node.data[rule.field];
                    let isValid = true;

                    if (rule.required && (value === undefined || value === null || value === '')) {
                        isValid = false;
                    }

                    if (isValid && rule.validate && !rule.validate(value, node.data, context)) {
                        isValid = false;
                    }

                    if (!isValid) {
                        const error: ValidationError = {
                            blockId: node.id,
                            field: rule.field,
                            message: rule.message,
                            severity: 'error'
                        };
                        errors.push(error);

                        if (!blockErrors[node.id]) blockErrors[node.id] = [];
                        blockErrors[node.id].push(error);
                    }
                });
            }
        });

        // 2. Validate Structure

        // A. Start Block Existence
        const startNode = nodes.find(n => n.data.type === 'START');
        if (!startNode && nodes.length > 0) {
            const error: ValidationError = {
                blockId: 'global',
                message: 'Flow must have a "Start Program" block.',
                severity: 'error'
            };
            errors.push(error);
        }

        // B. Connectivity Check (Orphaned Blocks)
        if (startNode && edges.length > 0) {
            const visited = new Set<string>();
            const queue = [startNode.id];
            visited.add(startNode.id);

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const outgoing = edges.filter(e => e.source === currentId);
                for (const edge of outgoing) {
                    if (!visited.has(edge.target)) {
                        visited.add(edge.target);
                        queue.push(edge.target);
                    }
                }
            }

            nodes.forEach(node => {
                if (!visited.has(node.id)) {
                    const error: ValidationError = {
                        blockId: node.id,
                        message: 'This block is not connected to the Start.',
                        severity: 'warning'
                    };
                    errors.push(error);
                    if (!blockErrors[node.id]) blockErrors[node.id] = [];
                    blockErrors[node.id].push(error);
                }
            });
        }

        // C. Path to End Check (Global + Dead Ends)
        const endNodes = nodes.filter(n => n.data.type === 'END');

        if (nodes.length > 0 && endNodes.length === 0) {
            const error: ValidationError = {
                blockId: 'global',
                message: 'Flow must have an "End Program" block.',
                severity: 'error'
            };
            errors.push(error);
        } else if (startNode && endNodes.length > 0 && edges.length > 0) {
            // Check reverse reachability
            const canReachEnd = new Set<string>();

            // Valid endpoints: END blocks and FLOW_CONTROL (except LABEL)
            const validEndpoints = nodes.filter(n =>
                n.data.type === 'END' ||
                (n.data.type === 'FLOW_CONTROL' && n.data.controlType !== 'LABEL')
            );

            const queue = validEndpoints.map(n => n.id);
            queue.forEach(id => canReachEnd.add(id));

            // Build reverse adjacency list
            const reverseEdges: Record<string, string[]> = {};
            edges.forEach(e => {
                if (!reverseEdges[e.target]) reverseEdges[e.target] = [];
                reverseEdges[e.target].push(e.source);
            });

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const sources = reverseEdges[currentId] || [];
                for (const sourceId of sources) {
                    if (!canReachEnd.has(sourceId)) {
                        canReachEnd.add(sourceId);
                        queue.push(sourceId);
                    }
                }
            }

            // 1. Global Check: Can Start reach End?
            if (!canReachEnd.has(startNode.id)) {
                const error: ValidationError = {
                    blockId: startNode.id,
                    message: 'The Start block cannot reach any End block.',
                    severity: 'error'
                };
                errors.push(error);
                if (!blockErrors[startNode.id]) blockErrors[startNode.id] = [];
                blockErrors[startNode.id].push(error);
            }

            // Re-run forward BFS to identify isolated islands (avoid double reporting)
            const visitedForward = new Set<string>();
            const fQueue = [startNode.id];
            visitedForward.add(startNode.id);
            while (fQueue.length > 0) {
                const cid = fQueue.shift()!;
                const out = edges.filter(e => e.source === cid);
                for (const oe of out) {
                    if (!visitedForward.has(oe.target)) {
                        visitedForward.add(oe.target);
                        fQueue.push(oe.target);
                    }
                }
            }

            // 1.5 Identify Nodes inside Loop Bodies
            const insideLoopBody = new Set<string>();
            const loopNodes = nodes.filter(n => n.data.type === 'LOOP');

            loopNodes.forEach(loopNode => {
                const bodyEdges = edges.filter(e => e.source === loopNode.id && e.sourceHandle === 'body');
                const queueLoop = bodyEdges.map(e => e.target);

                while (queueLoop.length > 0) {
                    const currentId = queueLoop.shift()!;
                    if (!insideLoopBody.has(currentId)) {
                        insideLoopBody.add(currentId);

                        const node = nodes.find(n => n.id === currentId);
                        // If FlowControl (Jump), stop propagation unless it's a LABEL (passthrough)
                        if (node?.data.type === 'FLOW_CONTROL' && node.data.controlType !== 'LABEL') {
                            continue;
                        }

                        const outgoing = edges.filter(e => e.source === currentId);
                        outgoing.forEach(e => queueLoop.push(e.target));
                    }
                }
            });

            nodes.forEach(node => {
                // Ignore orphaned nodes for dead-end check (already flagged)
                if (!visitedForward.has(node.id)) return;

                // Check 1: Mandatory Loop Back inside Loop Body
                if (insideLoopBody.has(node.id) && node.data.type === 'FLOW_CONTROL') {
                    if (node.data.controlType !== 'LOOP_BACK' && node.data.controlType !== 'LABEL') {
                        const error: ValidationError = {
                            blockId: node.id,
                            message: 'Inside a loop, you should use "Loop Back" to close the cycle instead of generic GoTo.',
                            severity: 'warning'
                        };
                        errors.push(error);
                        if (!blockErrors[node.id]) blockErrors[node.id] = [];
                        blockErrors[node.id].push(error);
                    }
                }

                // Check 2: Dead Ends
                if (node.data.type !== 'END' && !canReachEnd.has(node.id)) {
                    let message = 'This path leads to a dead end (no End block).';

                    if (insideLoopBody.has(node.id)) {
                        if (node.data.type === 'FLOW_CONTROL' && node.data.controlType === 'LABEL') {
                            message = 'A Label cannot end a loop body. Use "Loop Back" or connect this Label to logic.';
                        } else {
                            message = 'Loop sequence incomplete. Add a "Flow Control" (Loop Back) block to close the loop.';
                        }
                    }

                    const error: ValidationError = {
                        blockId: node.id,
                        message: message,
                        severity: 'error'
                    };
                    errors.push(error);
                    if (!blockErrors[node.id]) blockErrors[node.id] = [];
                    blockErrors[node.id].push(error);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            blockErrors
        };
    }
}
