const axios = require('axios');
const qs = require('qs');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    const getBuffer = async (url, options = {}) => {
        try {
            const res = await axios({ method: "get", url, headers: { DNT: 1, 'Upgrade-Insecure-Request': 1, 'User-Agent': 'Mozilla/5.0' }, ...options, responseType: 'arraybuffer'});
            return res.data;
        } catch (err) { console.error("getBuffer error:", err.message); throw new Error("Failed to get buffer from URL."); }
    };

    const toolList = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

    const pxpic = {
        upload: async (buffer, ext = 'png', mime = 'image/png') => {
            const fileName = Date.now() + "." + ext;
            const responsej = await axios.post("https://pxpic.com/getSignedUrl", { folder: "uploads", fileName }, { headers: { "Content-Type": "application/json" } });
            const { presignedUrl } = responsej.data;
            await axios.put(presignedUrl, buffer, { headers: { "Content-Type": mime } });
            return "https://files.fotoenhancer.com/uploads/" + fileName;
        },
        create: async (buffer, tools) => {
            if (!toolList.includes(tools)) throw new Error(`Invalid tool. Choose from: ${toolList.join(', ')}`);
            const imageUrl = await pxpic.upload(buffer); // Defaults to png
            let data = qs.stringify({
                imageUrl, targetFormat: 'png', needCompress: 'no', imageQuality: '100',
                compressLevel: '6', fileOriginalExtension: 'png', aiFunction: tools, upscalingLevel: (tools === 'upscale' ? '2x' : '') // example upscale level
            });
            const config = { method: 'POST', url: 'https://pxpic.com/callAiFunction', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Content-Type': 'application/x-www-form-urlencoded', 'accept-language': 'en-US,en;q=0.9' }, data };
            const api = await axios.request(config);
            if (!api.data || !api.data.resultImageUrl) throw new Error("PxPic API did not return resultImageUrl.");
            return api.data;
        }
    };

    toolList.forEach(endpoint => {
        app.get(`/api/${endpoint}`, apiKeyAuth, async (req, res) => {
            try {
                const { url } = req.query;
                if (!url) return res.status(400).json(loghandler.notparam("url"));
                const buffer = await getBuffer(url);
                const { resultImageUrl } = await pxpic.create(buffer, endpoint);
                if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
                res.status(200).json({ status: true, creator, result: resultImageUrl });
            } catch (e) {
                console.error(`Error in /api/${endpoint}:`, e.message);
                res.status(500).json(loghandler.fetchError(`PxPic ${endpoint}`));
            }
        });
    });
};