const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { Func, loghandler, creator } = configObjects;

    class Bstation {
        search = async function search(q) {
            try {
                let { data } = await axios.get("https://www.bilibili.tv/id/search-result?q=" + encodeURIComponent(q)).catch((e) => { throw e.response || e; });
                let $ = cheerio.load(data); let result = [];
                $(".bstar-video-card__text-wrap").each((index, element) => {
                    const videoTitle = $(element).find(".highlights").text();
                    if (!videoTitle) return;
                    result.push({
                        title: videoTitle,
                        views: $(element).find(".bstar-video-card__desc").text().trim(),
                        url: "https:" + $(element).closest(".bstar-video-card").find(".bstar-video-card__cover-wrap a").attr("href"),
                        thumbnail: $(element).closest(".bstar-video-card").find(".bstar-video-card__cover-wrap img.bstar-image__img").attr("src"),
                        duration: $(element).closest(".bstar-video-card").find(".bstar-video-card__cover-wrap .bstar-video-card__cover-mask-text--bold").text(),
                        author: { name: $(element).find(".bstar-video-card__nickname span").text(), avatar: $(element).find("img.bstar-image__img").attr("src") },
                    });
                });
                return result;
            } catch (e) { console.error("Bstation search error:", e.message); throw new Error("Failed to search Bstation"); }
        };
        download = async function download(url) {
            try {
                const appInfo = await axios.get(url).then((res) => res.data);
                const $ = cheerio.load(appInfo);
                const title = $('meta[property="og:title"]').attr("content")?.split("|")[0].trim();
                let { data: cobAPI } = await axios.post("https://c.blahaj.ca/", { url }, { headers: { Accept: "application/json", "Content-type": "application/json" } }).catch((e) => { throw e.response || e; });
                if (!cobAPI || !cobAPI.url) throw new Error("Failed to get download link from cob API");
                return {
                    metadata: { title, locate: $('meta[property="og:locale"]').attr("content"), thumbnail: $('meta[property="og:image"]').attr("content"), like: $(".interactive__btn.interactive__like .interactive__text").text(), view: $(".bstar-meta__tips-left .bstar-meta-text").first().text() },
                    download: { url: cobAPI.url, filename: cobAPI.filename, type: $('meta[property="og:video:type"]').attr("content") },
                };
            } catch (e) { console.error("Bstation download error:", e.message); throw new Error("Failed to download from Bstation"); }
        };
    }

    app.get('/api/bibli', apiKeyAuth, async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) return res.status(400).json(loghandler.notparam("query"));
            let call = new Bstation(); let result;
            if (Func.isUrl(query)) { result = await call.download(query); } else { result = await call.search(query); }
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Bstation"));
        }
    });
};