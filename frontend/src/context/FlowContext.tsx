import { createContext, useContext } from 'react';

interface FlowContextType {
    variables: any[];
}

const FlowContext = createContext<FlowContextType>({ variables: [] });

export const useFlowContext = () => useContext(FlowContext);
export const FlowProvider = FlowContext.Provider;
