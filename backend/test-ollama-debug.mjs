
import { createOllamaChat } from '@tanstack/ai-ollama';
// We need the core 'chat' function which orchestrates the adapter
// Assuming @tanstack/ai is installed as it's a devDependency or dependency
import { chat } from '@tanstack/ai';

async function testOllama() {
    try {
        console.log("Testing Ollama Adapter...");

        const adapter = createOllamaChat('llama3.2', 'http://127.0.0.1:11434');
        console.log("Adapter created.");

        // Simulate chat using the core function
        console.log("Sending 'Hello'...");
        const response = await chat({
            adapter: adapter,
            messages: [{ role: 'user', content: 'Hello' }]
        });

        console.log("Response stream received.");

        for await (const chunk of response) {
            console.log("Chunk received:", chunk);
            break;
        }

        console.log("SUCCESS!");
    } catch (e) {
        console.error("FAILURE:", e);
    }
}

testOllama();
