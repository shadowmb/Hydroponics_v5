export const FlowService = {
    async duplicate(id: string, name: string) {
        const res = await fetch(`/api/flows/${id}/duplicate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to duplicate flow');
        }

        return res.json();
    }
};
