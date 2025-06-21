const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { git, loghandler, creator } = configObjects; // Assuming git.token is in config

    async function gpt4oChat(query) { // Renamed
        if (!git || !git.token) throw new Error("GitHub AI token (git.token) is not configured.");
        try {
            const response = await axios.post(
                'https://models.github.ai/inference/chat/completions',
                { messages: [{ role: 'system', content: 'You are a helpful AI assistant.' },{ role: 'user', content: query }], temperature: 0.7, top_p: 1, model: 'openai/gpt-4o' }, // Corrected model, ensure this model ID is valid on GitHub AI
                { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${git.token}` } }
            );
            if (!response.data.choices || !response.data.choices[0].message.content) throw new Error("Invalid response structure from GitHub AI GPT-4o.");
            return response.data.choices[0].message.content;
        } catch (e) {
            console.error("GPT-4o GitHub AI Error:", e.response?.data || e.message);
            throw new Error("Failed to get response from GPT-4o via GitHub AI.");
        }
    }

    app.get("/api/gpt4-o", apiKeyAuth, async (req, res) => {
        try {
            const { prompt } = req.query;
            if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
            const result = await gpt4oChat(prompt);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: result.replaceAll("**", "*") });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("GPT-4o"));
        }
    });
};