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
import { LoopNode } from '../components/editor/nodes/LoopNode';
import { reactFlowToFlow, flowToReactFlow } from '../lib/flow-utils';
import { Button } from '../components/ui/button';
import { TooltipProvider } from '../components/ui/tooltip';
import { SaveFlowDialog } from '../components/editor/SaveFlowDialog';
import { toast } from 'sonner';
import { Save, Edit, Sliders } from 'lucide-react';
import { hardwareService } from '../services/hardwareService';
import { useStore } from '../core/useStore';
import { VariableManager } from '../components/editor/VariableManager';
import { slugify } from '../lib/string-utils';

const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    generic: GenericBlockNode,
    loop: LoopNode,
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
    console.log('FlowEditor params:', { id });
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [flowName, setFlowName] = useState('');
    const [flowDescription, setFlowDescription] = useState('');
    const [inputs, setInputs] = useState<any[]>([]);
    const [variables, setVariables] = useState<any[]>([]);

    // Load Flow Data
    useEffect(() => {
        if (!id) return;

        const fetchFlow = async () => {
            try {
                const res = await fetch(`/api/flows/${id}`);
                if (!res.ok) throw new Error('Failed to load flow');

                const flow = await res.json();
                const { nodes: flowNodes, edges: flowEdges } = flowToReactFlow(flow);

                setNodes(flowNodes);
                setEdges(flowEdges);
                setFlowName(flow.name);
                setFlowDescription(flow.description || '');
                setInputs(flow.inputs || []);
                setVariables(flow.variables || []);
                toast.success('Flow loaded');
            } catch (error) {
                console.error('Load error:', error);
                toast.error('Failed to load flow');
            }
        };

        fetchFlow();
    }, [id, setNodes, setEdges]);

    // Load Devices for Selector
    const { setDevices } = useStore();
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const devices = await hardwareService.getDevices();
                setDevices(devices);
            } catch (error) {
                console.error('Failed to load devices', error);
                toast.error('Failed to load devices');
            }
        };
        loadDevices();
    }, [setDevices]);

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
            const isLoop = type === 'LOOP';
            let nodeType = 'generic';
            if (isCondition) nodeType = 'condition';
            else if (isLoop) nodeType = 'loop';

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
        setSelectedEdge(null);
    }, []);

    const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
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

    const onEdgeUpdate = (edgeId: string, newStyle: any) => {
        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === edgeId) {
                    return { ...edge, style: { ...edge.style, ...newStyle } };
                }
                return edge;
            })
        );
        setSelectedEdge((prev: Edge | null) => prev ? { ...prev, style: { ...prev.style, ...newStyle } } : null);
    };

    const onDeleteNode = (nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNode(null);
    };

    const onDeleteEdge = (edgeId: string) => {
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        setSelectedEdge(null);
    };

    const onSave = useCallback(async (name: string, description: string) => {
        console.log('onSave called:', { name, id });
        const flowData = reactFlowToFlow(nodes, edges);

        // If editing existing flow, use its ID. Otherwise generate new one.
        const flowId = id || slugify(name);

        const payload = {
            ...flowData,
            id: flowId,
            name: name,
            description: description,
            inputs: inputs,
            variables: variables,
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
                setFlowName(name);
                setFlowDescription(description);
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
    }, [nodes, edges, id, inputs, variables]);

    const handleQuickSave = () => {
        if (!flowName) return;
        onSave(flowName, flowDescription);
    };

    const onDuplicateNode = useCallback((nodeId: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return;

        const newNode: Node = {
            ...JSON.parse(JSON.stringify(nodeToDuplicate)),
            id: `${nodeToDuplicate.type}_${Date.now()}`,
            position: {
                x: nodeToDuplicate.position.x + 50,
                y: nodeToDuplicate.position.y + 50
            },
            selected: true
        };

        // Deselect other nodes and add new one
        setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), newNode]);
        setSelectedNode(newNode);
        toast.success('Block duplicated');
    }, [nodes, setNodes]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="h-12 border-b bg-card flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold">Flow Editor</h2>
                    {flowName && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-medium">{flowName}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <VariableManager
                        variables={variables}
                        onUpdateVariables={setVariables}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={onPaneClick}
                        title="Show Flow Properties"
                    >
                        <Sliders className="h-4 w-4" />
                        Flow Props
                    </Button>
                    {id ? (
                        <>
                            <SaveFlowDialog onSave={onSave} defaultName={flowName} defaultDescription={flowDescription}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Details
                                </Button>
                            </SaveFlowDialog>
                            <Button size="sm" className="gap-2" onClick={handleQuickSave}>
                                <Save className="h-4 w-4" />
                                Update
                            </Button>
                        </>
                    ) : (
                        <SaveFlowDialog onSave={onSave} defaultName={flowName} defaultDescription={flowDescription}>
                            <Button size="sm" className="gap-2">
                                <Save className="h-4 w-4" />
                                Save Flow
                            </Button>
                        </SaveFlowDialog>
                    )}
                </div>
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
                        onEdgeClick={onEdgeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>

                <PropertiesPanel
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                    onChange={onNodeUpdate}
                    onEdgeChange={onEdgeUpdate}
                    onDeleteNode={onDeleteNode}
                    onDeleteEdge={onDeleteEdge}
                    onDuplicateNode={onDuplicateNode}
                    variables={variables}
                    onVariablesChange={setVariables}
                    flowDescription={flowDescription}
                    onFlowDescriptionChange={setFlowDescription}
                />
            </div>
        </div>
    );
};

export const FlowEditor = () => (
    <ReactFlowProvider>
        <TooltipProvider>
            <FlowEditorContent />
        </TooltipProvider>
    </ReactFlowProvider>
);
