// const fetch = require('node-fetch');

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/hardware/templates/controllers'); // Assuming this endpoint exists or similar
        // Wait, the endpoint is GET /api/hardware/templates for device templates.
        // For controller templates, it might be different.
        // Let's check routes.ts.

        // Actually, let's just use the generic templates endpoint if it returns everything, or check the DB directly via script.
        // But I want to know what the API sees.

        // In HardwareController.ts:
        // static async getControllerTemplates(req: FastifyRequest, reply: FastifyReply) { ... }
        // Route: GET /api/hardware/controllers/templates

        const response2 = await fetch('http://localhost:3000/api/hardware/templates');
        const json = await response2.json();
        console.log('Debug Info:', json.debug);
        const templates = json.data || json;
        if (templates.length > 0) {
            console.log('First Template Raw:', JSON.stringify(templates[0], null, 2));
        }
        templates.forEach(t => console.log(`Template: ${t.name}, Type: ${t.type}, ID: ${t._id}`));
    } catch (error) {
        console.error(error);
    }
}

run();
