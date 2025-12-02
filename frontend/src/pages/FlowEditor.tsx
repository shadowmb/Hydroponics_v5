import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, ReactFlowProvider } from '@xyflow/react';
import type { Node, Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from '../components/editor/Sidebar';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { ActionNode } from '../components/editor/nodes/ActionNode';
import { ConditionNode } from '../components/editor/nodes/ConditionNode';
import { GenericBlockNode } from '../components/editor/nodes/GenericBlockNode';
import { reactFlowToFlow, flowToReactFlow } from '../lib/flow-utils';
import { Button } from '../components/ui/button';
import { SaveFlowDialog } from '../components/editor/SaveFlowDialog';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    generic: GenericBlockNode,
};

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'generic',
        position: { x: 100, y: 100 },
        data: { label: 'Start', type: 'START' }
    },
    {
        id: 'end',
        type: 'generic',
        position: { x: 400, y: 100 },
        data: { label: 'End', type: 'END' }
    },
];

const FlowEditorContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [flowName, setFlowName] = useState('');
    const [flowDescription, setFlowDescription] = useState('');

    // Load Flow Data
    useEffect(() => {
        if (!id) return;

        const fetchFlow = async () => {
            try {
                const res = await fetch(`/api/flows/${id}`);
                if (!res.ok) throw new Error('Failed to load flow');

                const flow = await res.json();
                // Note: flowToProgram/programToFlow helpers might need renaming later but logic is same
                const { nodes: flowNodes, edges: flowEdges } = flowToReactFlow(flow);

                setNodes(flowNodes);
                setEdges(flowEdges);
                setFlowName(flow.name);
                setFlowDescription(flow.description || '');
                toast.success('Flow loaded');
            } catch (error) {
                console.error('Load error:', error);
                toast.error('Failed to load flow');
            }
        };

        fetchFlow();
    }, [id, setNodes, setEdges]);

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
            const nodeType = isCondition ? 'condition' : 'generic';

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
        setSelectedNode((prev: Node | null) => prev ? { ...prev, data: newData } : null);
    };

    const onSave = useCallback(async (name: string, description: string) => {
        const flowData = reactFlowToFlow(nodes, edges);

        // If editing existing flow, use its ID. Otherwise generate new one.
        const flowId = id || name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        const payload = {
            ...flowData,
            id: flowId,
            name: name,
            description: description,
            isActive: true
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/flows/${id}` : '/api/flows';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`Flow ${id ? 'updated' : 'saved'} successfully!`);
            } else {
                const err = await res.json();
                toast.error(`Failed to save: ${err.message}`);
                throw new Error(err.message); // Re-throw for dialog to handle
            }
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Failed to save flow');
            throw error;
        }
    }, [nodes, edges, id]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="h-12 border-b bg-card flex items-center px-4 justify-between">
                <h2 className="font-semibold">Flow Editor</h2>
                <SaveFlowDialog onSave={onSave} defaultName={flowName}>
                    <Button size="sm" className="gap-2">
                        <Save className="h-4 w-4" />
                        {id ? 'Update Flow' : 'Save Flow'}
                    </Button>
                </SaveFlowDialog>
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
