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
    static validate(nodes: Node[], edges: Edge[]): ValidationResult {
        const errors: ValidationError[] = [];
        const blockErrors: Record<string, ValidationError[]> = {};

        // 1. Validate Blocks
        nodes.forEach(node => {
            const nodeType = node.data.type as string;
            // Map generic types to specific rules if needed, or rely on data.type being accurate
            // In FlowEditor.tsx: const isCondition = type === 'IF';

            const rules = BlockValidationRules[nodeType];

            console.log(`Debug Validator:`, { id: node.id, type: nodeType, rules: !!rules, data: node.data });

            if (rules) {
                rules.forEach(rule => {
                    const value = node.data[rule.field];
                    let isValid = true;

                    if (rule.required && (value === undefined || value === null || value === '')) {
                        isValid = false;
                    }

                    if (isValid && rule.validate && !rule.validate(value, node.data)) {
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

        // 2. Validate Structure (Start/End existence)
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
                // Find all outgoing edges
                const outgoing = edges.filter(e => e.source === currentId);
                for (const edge of outgoing) {
                    if (!visited.has(edge.target)) {
                        visited.add(edge.target);
                        queue.push(edge.target);
                    }
                }
            }

            // check for unvisited nodes (excluding disconnected comments/logs if we had them, but for now strict)
            nodes.forEach(node => {
                if (!visited.has(node.id)) {
                    const error: ValidationError = {
                        blockId: node.id,
                        message: 'This block is not connected to the Start.',
                        severity: 'warning' // Warning for now, or error? Let's do warning.
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
            // Check reverse reachability: Can nodes reach any End?
            const canReachEnd = new Set<string>();
            const queue = endNodes.map(n => n.id);
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
                    blockId: startNode.id, // Or global
                    message: 'The Start block cannot reach any End block.',
                    severity: 'error'
                };
                errors.push(error);
                if (!blockErrors[startNode.id]) blockErrors[startNode.id] = [];
                blockErrors[startNode.id].push(error);
            }

            // 2. Dead End Check: Which connected nodes cannot reach End?
            // Only check nodes that ARE reachable from Start (otherwise they are already flagged as orphans)
            // This avoids double errors on isolated islands.

            // For simplicity, let's assume we want to flag "Dead Ends" even if orphaned, or just prioritize orphans.
            // Let's flag any non-End node that cannot reach End.

            nodes.forEach(node => {
                if (node.data.type !== 'END' && !canReachEnd.has(node.id)) {
                    // Reduce noise: If it's already an orphan, verify if we want to add another error.
                    // Ideally, fix specific bugs -> orphaned first.
                    // But if it IS reachable from Start, but cannot reach End, it's a true Dead End.
                    // We need to know if it's reachable from Start (Step B).
                    // Refactoring to share 'visited' set from Step B would be cleaner, but for now let's just add the error.

                    const error: ValidationError = {
                        blockId: node.id,
                        message: 'This path leads to a dead end (no End block).',
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
