// const fetch = require('node-fetch');

async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/hardware/controllers');
        const json = await response.json();
        const controllers = json.data || json;
        if (controllers.length > 0) {
            console.log(controllers[0]._id);
            // console.log(JSON.stringify(controllers[0].ports)); // To see available ports
        } else {
            console.log('No controllers found');
        }
    } catch (error) {
        console.error(error);
    }
}

run();
