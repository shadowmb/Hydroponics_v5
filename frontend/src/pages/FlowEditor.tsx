import React, { useCallback, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, ReactFlowProvider } from '@xyflow/react';
import type { Node, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from '../components/editor/Sidebar';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { ActionNode } from '../components/editor/nodes/ActionNode';
import { ConditionNode } from '../components/editor/nodes/ConditionNode';
import { flowToProgram } from '../lib/flow-utils';
import { Button } from '../components/ui/button';
import { SaveProgramDialog } from '../components/editor/SaveProgramDialog';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'action',
        position: { x: 250, y: 5 },
        data: { label: 'Start Log', type: 'LOG', message: 'Program Started' }
    },
];

const FlowEditorContent: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const isCondition = type === 'IF';
            const nodeType = isCondition ? 'condition' : 'action';

            const newNode: Node = {
                id: `${type}_${Date.now()}`,
                type: nodeType,
                position,
                data: { label: label, type: type },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const onNodeUpdate = (nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        setSelectedNode((prev) => prev ? { ...prev, data: newData } : null);
    };

    const onSave = useCallback(async (name: string, description: string) => {
        const programData = flowToProgram(nodes, edges);
        const payload = {
            ...programData,
            id: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'), // Better ID generation
            name: name,
            description: description,
            active: true
        };

        try {
            const res = await fetch('/api/programs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Program saved successfully!');
            } else {
                const err = await res.json();
                toast.error(`Failed to save: ${err.message}`);
                throw new Error(err.message); // Re-throw for dialog to handle
            }
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Failed to save program');
            throw error;
        }
    }, [nodes, edges]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="h-12 border-b bg-card flex items-center px-4 justify-between">
                <h2 className="font-semibold">Flow Editor</h2>
                <SaveProgramDialog onSave={onSave}>
                    <Button size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Program
                    </Button>
                </SaveProgramDialog>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />

                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>

                <PropertiesPanel selectedNode={selectedNode} onChange={onNodeUpdate} />
            </div>
        </div>
    );
};

export const FlowEditor = () => (
    <ReactFlowProvider>
        <FlowEditorContent />
    </ReactFlowProvider>
);
