const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    async function xdown(url) {
        try {
            const res = await axios.post("https://twmate.com/download", new URLSearchParams({ url }), { // Changed endpoint and payload
                headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36", "Referer": "https://twmate.com/" }
            });
            const $ = cheerio.load(res.data);
            const videoLinks = [];
            const imageLinks = [];

            // For videos
            $('table tbody tr').each((i, elem) => {
                const quality = $(elem).find('td:nth-child(1)').text().trim();
                const downloadUrl = $(elem).find('td:nth-child(3) a').attr('href');
                if (quality && downloadUrl && (downloadUrl.includes(".mp4") || downloadUrl.includes("video.twimg"))) {
                    videoLinks.push({ quality, url: downloadUrl });
                }
            });
            // For images
            $('.gallery .item a.lightbox').each((i, elem) => {
                const imageUrl = $(elem).attr('href');
                if (imageUrl) imageLinks.push({ url: imageUrl });
            });

            if (videoLinks.length > 0) return { type: 'video', links: videoLinks };
            if (imageLinks.length > 0) return { type: 'image', links: imageLinks };
            
            throw new Error("Konten tidak ditemukan atau tidak didukung oleh TwMate.");
        } catch (e) {
            console.error("Twitter/X Downloader Error (TwMate):", e.response?.data || e.message);
            throw new Error("Gagal mengambil data dari Twitter/X via TwMate.");
        }
    }

    app.get("/api/twitter", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await xdown(url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Twitter/X Downloader"));
        }
    });
};