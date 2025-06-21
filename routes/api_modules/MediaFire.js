const cheerio = require("cheerio");
const axios = require("axios"); // Using axios as per other files for consistency
const { lookup } = require("mime-types");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    async function mediafire(url) {
        try {
            const res = await axios.get(url, { headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'} });
            const html = res.data;
            const $ = cheerio.load(html);
            const downloadLinkRaw = $('#downloadButton').attr('href');
            if (!downloadLinkRaw) throw new Error("Download button not found or href attribute missing.");
            
            const filename = $('div.dl-btn-label').attr('title') || $('div.filename').text().trim() || "unknown_file";
            const sizeText = $('a#downloadButton').text().trim().match(/\(([^)]+)\)/); // Extracts (123.45 MB)
            const size = sizeText ? sizeText[1] : "unknown_size";
            const filetype = filename.includes('.') ? filename.split('.').pop() : 'bin';
            const mimetype = lookup(filetype.toLowerCase()) || "application/octet-stream";

            return {
                filename: filename,
                filetype: filetype,
                size: size,
                mimetype: mimetype,
                link: downloadLinkRaw
            };
        } catch (e) {
            console.error("MediaFire Error:", e.message, url);
            throw new Error("Gagal mengambil data dari link MediaFire tersebut.");
        }
    }

    app.get("/api/mediafire", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await mediafire(url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (e) {
            res.status(500).json(loghandler.fetchError("MediaFire"));
        }
    });
};