const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    async function geminiImageAnalysis(text, imageUrl) { // Renamed
        try {
            const apiUrl = `https://gemini-api-5k0h.onrender.com/gemini/image`;
            const params = { q: text, url: imageUrl };
            const response = await axios.get(apiUrl, { params });
            if (!response.data || typeof response.data.content === 'undefined') throw new Error("Invalid response from Gemini Image API");
            return response.data.content;
        } catch (e) {
            console.error("Gemini Image API Error:", e.response?.data || e.message);
            throw new Error("Failed to analyze image with Gemini.");
        }
    }

    app.get("/api/gemini-image", apiKeyAuth, async (req, res) => {
        try {
            const { prompt, url } = req.query;
            if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const results = await geminiImageAnalysis(prompt, url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: results.replaceAll("**", "*") });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Gemini Image Analysis"));
        }
    });
};