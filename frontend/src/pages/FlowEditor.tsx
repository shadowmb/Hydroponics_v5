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
import { FlowControlNode } from '../components/editor/nodes/FlowControlNode';
import { reactFlowToFlow, flowToReactFlow } from '../lib/flow-utils';
import { Button } from '../components/ui/button';
import { TooltipProvider } from '../components/ui/tooltip';
import { SaveFlowDialog } from '../components/editor/SaveFlowDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Save, Edit, Sliders, AlertTriangle } from 'lucide-react';
import { hardwareService } from '../services/hardwareService';
import { useStore } from '../core/useStore';
import { VariableManager } from '../components/editor/VariableManager';
import { slugify } from '../lib/string-utils';
import { FlowValidator } from '../lib/validation/FlowValidator';

const nodeTypes = {
    action: ActionNode,
    condition: ConditionNode,
    generic: GenericBlockNode,
    loop: LoopNode,
    flowControl: FlowControlNode
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
    // const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    // Draft Save State
    const [showDraftDialog, setShowDraftDialog] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState<{ name: string, description: string } | null>(null);


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

    // Validation Effect
    const { devices, deviceTemplates } = useStore();
    useEffect(() => {
        const context = {
            devices,
            variables,
            deviceTemplates
        };
        const result = FlowValidator.validate(nodes, edges, context);
        // setValidationErrors(result.errors);

        // Update nodes with error state
        setNodes((nds) => {
            let hasChanges = false;
            const newNodes = nds.map((node) => {
                const nodeErrors = result.blockErrors[node.id];
                const hasError = !!nodeErrors;
                const errorMsg = hasError ? nodeErrors[0].message : undefined;

                if (node.data.error !== errorMsg || node.data.hasError !== hasError) {
                    hasChanges = true;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            hasError: hasError,
                            error: errorMsg,
                        },
                    };
                }
                return node;
            });
            return hasChanges ? newNodes : nds;
        });

    }, [nodes.map(n => JSON.stringify({ ...n.data, hasError: undefined, error: undefined })).join('|'), edges, setNodes, devices, variables, deviceTemplates]);

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
            const isFlowControl = type === 'FLOW_CONTROL';

            let nodeType = 'generic';
            if (isCondition) nodeType = 'condition';
            else if (isLoop) nodeType = 'loop';
            else if (isFlowControl) nodeType = 'flowControl';

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
        const node = nodes.find(n => n.id === nodeId);
        if (node?.data.type === 'START' || node?.data.type === 'END') {
            toast.error('Start and End blocks cannot be deleted.');
            return;
        }
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNode(null);
    };

    const onDeleteEdge = (edgeId: string) => {
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        setSelectedEdge(null);
    };

    const saveFlowToBackend = async (name: string, description: string, isValid: boolean) => {
        const flowData = reactFlowToFlow(nodes, edges);
        const flowId = id || slugify(name);

        const payload = {
            ...flowData,
            id: flowId,
            name: name,
            description: description,
            inputs: inputs,
            variables: variables,
            isActive: isValid, // If invalid, force inactive
            validationStatus: isValid ? 'VALID' : 'INVALID'
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/flows/${id}` : '/api/flows';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }

        return flowId;
    };

    const onSave = useCallback(async (name: string, description: string) => {
        console.log('onSave called:', { name, id });

        // Final Validation Check
        const context = {
            devices: useStore.getState().devices,
            variables: variables,
            deviceTemplates: useStore.getState().deviceTemplates
        };
        const validationResult = FlowValidator.validate(nodes, edges, context);

        if (!validationResult.isValid) {
            // Prompt for Draft Save
            setPendingSaveData({ name, description });
            setShowDraftDialog(true);
            return;
        }

        try {
            await saveFlowToBackend(name, description, true);
            toast.success(`Flow ${id ? 'updated' : 'saved'} successfully!`);
            setFlowName(name);
            setFlowDescription(description);
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(`Failed to save: ${error.message}`);
            throw error;
        }
    }, [nodes, edges, id, inputs, variables]);

    const handleConfirmDraft = async () => {
        if (!pendingSaveData) return;

        try {
            await saveFlowToBackend(pendingSaveData.name, pendingSaveData.description, false);
            toast.success('Flow saved as Draft (Inactive)');
            setFlowName(pendingSaveData.name);
            setFlowDescription(pendingSaveData.description);
            setShowDraftDialog(false);
        } catch (error: any) {
            toast.error(`Failed to save draft: ${error.message}`);
        }
    };


    const handleQuickSave = () => {
        if (!flowName) return;
        onSave(flowName, flowDescription);
    };

    const onDuplicateNode = useCallback((nodeId: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return;

        if (nodeToDuplicate.data.type === 'START' || nodeToDuplicate.data.type === 'END') {
            toast.error('Start and End blocks cannot be duplicated.');
            return;
        }

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
                    nodes={nodes}
                    edges={edges}
                    onSelectBlock={(nodeId) => {
                        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })));
                        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

                        // Focus on the node
                        if (reactFlowInstance) {
                            reactFlowInstance.fitView({
                                nodes: [{ id: nodeId }],
                                duration: 800,
                                padding: 2, // Keep some distance
                                maxZoom: 1.5
                            });
                            // Also update selected state immediately for PropertiesPanel
                            const node = nodes.find(n => n.id === nodeId);
                            if (node) setSelectedNode(node);
                        }
                    }}
                />
            </div>

            <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" />
                            Validation Errors Found
                        </DialogTitle>
                        <DialogDescription>
                            This flow contains errors and cannot be run in its current state.
                            <br /><br />
                            Do you want to save it as a <strong>Draft</strong>? It will be marked as <span className="font-mono text-xs bg-muted px-1 rounded">INVALID</span> and automatically <strong>Deactivated</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDraftDialog(false)}>Cancel</Button>
                        <Button variant="default" className="bg-orange-600 hover:bg-orange-700" onClick={handleConfirmDraft}>
                            Save as Draft
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export const FlowEditor = () => (
    <ReactFlowProvider>
        <TooltipProvider>
            <FlowEditorContent />
        </TooltipProvider>
    </ReactFlowProvider>
);
