const axios = require("axios");
const crypto = require("crypto");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    async function getServerTime() {
        try {
            const { data } = await axios.get('https://sssinstagram.com/msec', { timeout: 3000 });
            return Math.floor(data.msec * 1000);
        } catch { return Date.now(); }
    }

    function generateSignature(url, secretKey, timestamp) {
        const adjustedTime = Date.now() - (timestamp ? Date.now() - timestamp : 0);
        const raw = `${url}${adjustedTime}${secretKey}`;
        return { signature: crypto.createHash('sha256').update(raw).digest('hex'), adjustedTime };
    }

    async function scrapeInstagram(url) {
        const secretKey = '19e08ff42f18559b51825685d917c5c9e9d89f8a5c1ab147f820f46e94c3df26';
        const timestamp = await getServerTime();
        const { signature, adjustedTime } = generateSignature(url, secretKey, timestamp);
        const payload = { url, ts: adjustedTime, _ts: 1739186038417, _tsc: Date.now() - timestamp, _s: signature };
        const headers = { 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://sssinstagram.com/', 'Origin': 'https://sssinstagram.com/' };
        try {
            const { data } = await axios.post('https://sssinstagram.com/api/convert', payload, { headers, timeout: 10000 });
            if (!data || (data.status && data.status !== 'ok') || !data.meta) throw new Error(data.message || 'Invalid response from sssinstagram');
            return data; // data.items should contain download links
        } catch (err) {
            console.error("Instagram Scrape Error (sssinstagram):", err.message);
            throw new Error('Gagal mengambil data dari Instagram via sssinstagram.');
        }
    }

    app.get("/api/instagram", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await scrapeInstagram(url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Instagram"));
        }
    });
};