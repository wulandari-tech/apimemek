const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { Api, git, groq, cloudflare, loghandler, creator } = configObjects;

    async function deepseekChat(query) { // Renamed
        try { // OpenRouter
            if (Api && Api.key) {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions',
                    { model: 'deepseek/deepseek-chat', messages: [{ role: 'user', content: query }] }, // Adjusted model name, might need checking
                    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Api.key}` } });
                if(response.data.choices && response.data.choices[0].message.content) return response.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (e) { console.warn("DeepSeek OpenRouter failed:", e.message); }
        try { // GitHub AI
            if (git && git.token) {
                let response = await axios.post('https://models.github.ai/inference/chat/completions',
                    { messages: [{ role: 'user', content: query }], temperature: 0.7, max_tokens: 2048, model: 'deepseek/deepseek-coder-v2-lite-instruct' }, // Example model
                    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${git.token}` } });
                if(response.data.choices && response.data.choices[0].message.content) return response.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (e) { console.warn("DeepSeek GitHub AI failed:", e.message); }
        try { // Groq
            if (groq && groq.key) {
                let response = await axios.post("https://api.groq.com/openai/v1/chat/completions",
                    { messages: [{ role: "user", content: query }], model: "mixtral-8x7b-32768", temperature: 0.7, max_tokens: 1024 }, // Example model on Groq
                    { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groq.key}` } });
                if(response.data.choices && response.data.choices[0]?.message?.content) return response.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (e) { console.warn("DeepSeek Groq failed:", e.message); }
        try { // Cloudflare
             if (cloudflare && cloudflare.id && cloudflare.key) {
                const res = await axios.post(`https://api.cloudflare.com/client/v4/accounts/${cloudflare.id}/ai/run/@cf/deepseek-ai/deepseek-math-7b-instruct`, // Check CF for correct model
                { messages: [{role: "user", content: query}] }, { headers: { Authorization: `Bearer ${cloudflare.key}`, 'Content-Type': 'application/json' }});
                if(res.data.result && res.data.result.response) return res.data.result.response.replace(/\*\*(.*?)\*\*/g, '*$1*');
            }
        } catch (e) { console.warn("DeepSeek Cloudflare failed:", e.message); }
        throw new Error("All DeepSeek providers failed or are not configured.");
    }

    app.get(`/api/deepseek`, apiKeyAuth, async (req, res) => {
        const { prompt } = req.query;
        if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
        try {
            const data = await deepseekChat(prompt);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: data });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("DeepSeek AI"));
        }
    });
};