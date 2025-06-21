const axios = require('axios');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { Api, groq, cloudflare, loghandler, creator } = configObjects; // Assuming these keys are in config.js

    async function meta(query) {
        try { // Attempt OpenRouter first
            if (Api && Api.key) {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions',
                    { model: "meta-llama/llama-3-8b-instruct:free", messages: [{ role: "user", content: query }] },
                    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Api.key}` } }
                );
                if (response.data.choices && response.data.choices[0].message.content) return response.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (openRouterError) { console.warn("OpenRouter LLaMA failed:", openRouterError.message); }
        try { // Fallback to Groq
            if (groq && groq.key) {
                const res = await axios.post("https://api.groq.com/openai/v1/chat/completions",
                    { messages: [{ role: "user", content: query }], model: "llama3-8b-8192", temperature: 0.7, max_tokens: 1024, top_p: 1, stream: false },
                    { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groq.key}` } }
                );
                if (res.data.choices && res.data.choices[0]?.message?.content) return res.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (groqError) { console.warn("Groq LLaMA failed:", groqError.message); }
        try { // Fallback to Cloudflare
            if (cloudflare && cloudflare.id && cloudflare.key) {
                const res = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${cloudflare.id}/ai/run/@cf/meta/llama-3-8b-instruct`,
                    { messages: [{role: "user", content: query}] }, // Adjusted payload for Cloudflare messages
                    { headers: { Authorization: `Bearer ${cloudflare.key}`, 'Content-Type': 'application/json' } }
                );
                if (res.data.result && res.data.result.response) return res.data.result.response.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (cfError) { console.warn("Cloudflare LLaMA failed:", cfError.message); }
        throw new Error("All LLaMA providers failed or are not configured.");
    }

    app.get("/api/llmma", apiKeyAuth, async (req, res) => {
        try {
            const { prompt } = req.query;
            if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
            const result = await meta(prompt);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (e) {
            res.status(500).json(loghandler.fetchError("LLaMA (Meta AI)"));
        }
    });
};