const axios = require('axios');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    async function fetchContent(content) {
        try {
            const response = await axios.post('https://luminai.my.id/', { content });
            return response.data;
        } catch (error) {
            console.error("Error fetching content from LuminAI:", error.message);
            throw new Error("Failed to fetch from LuminAI");
        }
    }
    app.get('/api/luminai', apiKeyAuth, async (req, res) => {
        try {
            const { text } = req.query;
            if (!text) return res.status(400).json(loghandler.notparam("text"));
            
            const data = await fetchContent(text);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: data.result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("LuminAI"));
        }
    });
};