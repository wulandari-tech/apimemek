const axios = require('axios');
const FormData = require('form-data');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    async function hydromind(content, model) {
        const form = new FormData();
        form.append('content', content);
        form.append('model', model);
        try {
            const { data } = await axios.post('https://mind.hydrooo.web.id/v1/chat/', form, {
                headers: { ...form.getHeaders() }
            });
            return data;
        } catch (error) {
            console.error("Error fetching from Hydromind:", error.message);
            throw new Error("Failed to fetch from Hydromind");
        }
    }
    app.get('/api/hydromind', apiKeyAuth, async (req, res) => {
        try {
            const { text, model } = req.query;
            if (!text) return res.status(400).json(loghandler.notparam("text"));
            if (!model) return res.status(400).json(loghandler.notparam("model"));
            
            const data = await hydromind(text, model);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: data.result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Hydromind"));
        }
    });
};