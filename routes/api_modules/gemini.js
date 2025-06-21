const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    async function geminiChat(prompt) { // Renamed
        try {
            const apiUrl = `https://gemini-api-5k0h.onrender.com/gemini/chat`;
            const params = { q: prompt };
            const response = await axios.get(apiUrl, { params });
            if (!response.data || typeof response.data.content === 'undefined') throw new Error("Invalid response from Gemini Chat API");
            return response.data.content;
        } catch (e) {
            console.error("Gemini Chat API Error:", e.response?.data || e.message);
            throw new Error("Failed to chat with Gemini.");
        }
    }

    app.get("/api/gemini", apiKeyAuth, async (req, res) => {
        try {
            const { prompt } = req.query;
            if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
            const result = await geminiChat(prompt);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: result.replaceAll("**", "*") });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Gemini Chat"));
        }
    });
};