const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    app.get("/api/tiktok", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const response = await axios.post("https://www.tikwm.com/api/?url=" + encodeURIComponent(url) + "&hd=1"); // Ensure URL is encoded
            if (response.data && response.data.code === 0 && response.data.data) {
                if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
                res.status(200).json({ status: true, creator, result: response.data.data });
            } else {
                throw new Error(response.data.msg || "Failed to fetch from TikWM, invalid response structure.");
            }
        } catch (e) {
            console.error("TikTok (TikWM) Error:", e.response?.data || e.message);
            res.status(500).json(loghandler.fetchError("TikTok (TikWM)"));
        }
    });
};