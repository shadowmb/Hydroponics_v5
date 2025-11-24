// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/hardware/templates');
        const json = await response.json();
        const templates = json.data || json;
        if (templates.length > 0) {
            templates.forEach(t => console.log(`${t.name}: ${t._id}`));
        } else {
            console.log('No templates found');
        }
    } catch (error) {
        console.error(error);
    }
}

run();
