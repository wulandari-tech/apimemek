const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const BASE_URL = "https://www.texttoimage.org";
    const headers = { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Origin: BASE_URL, Referer: `${BASE_URL}/`, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0 Safari/537.36" };

    async function textToImageAI(prompt) { // Renamed for clarity
        if (!prompt) throw new Error("Prompt parameter is required.");
        try {
            let q = new URLSearchParams({ prompt });
            let { data: generateData } = await axios.post(`${BASE_URL}/generate`, q, { headers });
            if (!generateData || !generateData.url) throw new Error("Failed to get generation URL from texttoimage.org");
            
            let html = await axios.get(`${BASE_URL}/${generateData.url}`, { headers });
            const $ = cheerio.load(html.data);
            let resultUrl = $(".image-container").find("img").attr("src");
            if (!resultUrl) throw new Error("Could not find image in result page from texttoimage.org");
            
            return BASE_URL + resultUrl;
        } catch (e) {
            console.error("TextToImage Error:", e.message);
            throw new Error("An error occurred with TextToImage service.");
        }
    }

    app.get("/api/text2img", apiKeyAuth, async (req, res) => {
        try {
            let { prompt } = req.query;
            if (!prompt) return res.status(400).json(loghandler.notparam("prompt"));
            // Optional: Auto-translate to English if desired, or expect English prompts
            // const { data: translateData } = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(prompt)}`);
            // const translatedPrompt = translateData[0][0][0];
            const resultImageUrl = await textToImageAI(prompt); // Using original prompt
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: resultImageUrl });
        } catch (e) {
            res.status(500).json(loghandler.fetchError("Text2Img"));
        }
    });
};