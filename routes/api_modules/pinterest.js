const axios = require("axios");
const cheerio = require("cheerio");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { Func, loghandler, creator } = configObjects;
    const base = "https://www.pinterest.com";
    const searchEndpoint = "/resource/BaseSearchResource/get/";
    const defaultHeaders = {
        accept: 'application/json, text/javascript, */*, q=0.01', referer: base,
        'user-agent': 'Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)', // More bot-like UA
        'x-app-version': 'a9522f', 'x-pinterest-appstate': 'active',
        'x-pinterest-pws-handler': 'www/[username]/[slug].js',
        'x-requested-with': 'XMLHttpRequest'
    };

    async function getCookiesAndCsrf() {
        try {
            const res = await axios.get(base, { headers: defaultHeaders });
            const cookies = res.headers['set-cookie']?.map(c => c.split(';')[0].trim()).join('; ') || "";
            const $ = cheerio.load(res.data);
            const csrfToken = $('meta[name="pinterest- σαν-token"]').attr('content') || $('meta[name="csrf-token"]').attr('content');
            return { cookies, csrfToken };
        } catch { return { cookies: "", csrfToken: null }; }
    }

    class Pinterest {
        search = async function (query) {
            if (!query) return { status: false, code: 400, result: { message: "Query kosong." } };
            try {
                const { cookies, csrfToken } = await getCookiesAndCsrf();
                if (!cookies || !csrfToken) return { status: false, code: 400, result: { message: "Gagal mengambil sesi Pinterest." } };
                const params = {
                    source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
                    data: JSON.stringify({
                        options: { query, scope: "pins", isPrefetch: false, page_size: 25, bookmarks: [""] }, // Increased page_size
                        context: {}
                    }),
                    _: Date.now()
                };
                const res = await axios.get(`${base}${searchEndpoint}`, { headers: { ...defaultHeaders, cookie: cookies, 'X-CSRFToken': csrfToken }, params });
                const results = res.data.resource_response?.data?.results
                    ?.filter(v => v.images?.orig?.url)
                    .map(v => ({ id: v.id, title: v.title || v.grid_title || "", description: v.description || "", image_url: v.images.orig.url })) || [];
                if (!results.length) return { status: false, code: 404, result: { message: `Tidak ada hasil untuk "${query}".` } };
                return results;
            } catch (e) {
                console.error("Pinterest Search Error:", e.response?.data || e.message);
                return { status: false, code: e.response?.status || 500, result: { message: "Server error saat mencari di Pinterest." } };
            }
        };
        download = async function (url) {
            try { // Try video download logic (lovetik method from douyin might be adaptable or find specific pinterest video downloader)
                 const lovetikApiUrl = "https://lovetik.app/api/ajaxSearch";
                 const formData = new URLSearchParams();
                 formData.append("q", url);
                 const response = await axios.post(lovetikApiUrl, formData.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "Mozilla/5.0" }});
                 if (response.data.status === "ok" && response.data.links) {
                    const videoLink = response.data.links.find(link => link.t.includes("Video"));
                    return { type: "video", title: response.data.desc, download: videoLink ? videoLink.a : response.data.links[0].a };
                 }
            } catch (videoError) { /* Fall through to image download if video attempt fails */ }
            try { // Image download logic
                const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
                const $ = cheerio.load(res.data);
                const jsonData = $('script[id="initial-state"]').html() || $('script[type="application/json"]').html();
                if (jsonData) {
                    const parsedData = JSON.parse(jsonData);
                    const pinData = parsedData?.resourceResponses?.[0]?.response?.data || parsedData?.props?.initialReduxState?.pins?.[Object.keys(parsedData.props.initialReduxState.pins)[0]];
                    if (pinData?.images?.orig?.url) {
                        return { type: "image", title: pinData.title || pinData.grid_title || "", download: pinData.images.orig.url };
                    }
                }
                const imageUrl = $('meta[property="og:image"]').attr('content') || $('img[class*="GrowthLaneAggregatedImage"]').first().attr('src') || $('img[data-test-id="pin-closeup-image"]').first().attr('src');
                 if(imageUrl) return { type: "image", title: $('meta[property="og:description"]').attr('content') || "Pinterest Image", download: imageUrl};

                throw new Error("Could not extract image or video from Pinterest URL.");
            } catch (e) { console.error("Pinterest Download Error:", e.message); throw new Error("Gagal mengambil data dari Pinterest."); }
        };
    }

    app.get("/api/pinterest", apiKeyAuth, async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) return res.status(400).json(loghandler.notparam("query"));
            const p = new Pinterest();
            const result = Func.isUrl(query) ? await p.download(query) : await p.search(query);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (e) {
            res.status(500).json(loghandler.fetchError("Pinterest"));
        }
    });
};