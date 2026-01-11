import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Взимаме ключа от терминала
const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Грешка: Моля, подайте API ключ като аргумент!");
    process.exit(1);
}

// 2. ДЕФИНИРАМЕ genAI (това липсваше в предишния ви опит)
const genAI = new GoogleGenerativeAI(apiKey);

// 3. Избираме един от моделите, които видяхме, че работят при вас
const modelName = "gemini-2.5-flash";

async function test() {
    try {
        console.log(`Проверка на връзката с модел: ${modelName}...`);

        // Тук използваме дефинираната вече genAI
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent("Здравей, това е тест на връзката. Отговори на български.");
        const response = await result.response;
        const text = response.text();

        console.log("-----------------------------------");
        console.log("✅ УСПЕШНО СВЪРЗВАНЕ!");
        console.log("Отговор от Gemini:");
        console.log(text);
        console.log("-----------------------------------");

    } catch (error) {
        console.error("❌ ГРЕШКА при изпълнение:");
        console.error(error.message);
    }
}

test();