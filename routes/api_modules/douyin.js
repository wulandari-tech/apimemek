const axios = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { Func, loghandler, creator } = configObjects;

    async function douyinDownload(url) {
        const apiUrl = "https://lovetik.app/api/ajaxSearch";
        const formData = new URLSearchParams();
        formData.append("q", url);
        formData.append("lang", "id");
        try {
            const response = await axios.post(apiUrl, formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Accept: "*/*", "X-Requested-With": "XMLHttpRequest" }
            });
            const data = response.data;
            if (data.status !== "ok") throw new Error("Gagal mengambil data Douyin dari lovetik.");
            const $ = cheerio.load(data.data);
            const title = $("h3").text();
            const thumbnail = $(".image-tik img").attr("src");
            const durationText = $(".content p").text();
            const dl = [];
            $(".dl-action a").each((_, el) => { dl.push({ text: $(el).text().trim(), url: $(el).attr("href") }); });
            return { title, thumbnail, duration: durationText, dl_links: dl };
        } catch (e) {
            console.error("Douyin Download Error (lovetik):", e.message);
            throw new Error("Gagal memproses link Douyin via lovetik.");
        }
    }

    class DouyinSearchPage {
        constructor() {
            this.baseURL = 'https://so.douyin.com/'; this.cookies = {};
            this.defaultParams = { search_entrance: 'aweme', enter_method: 'normal_search', innerWidth: '431', innerHeight: '814', is_no_width_reload: '1', keyword: '' };
            this.api = axios.create({ baseURL: this.baseURL, headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8', 'accept-language': 'id-ID,id;q=0.9', referer: 'https://so.douyin.com/', 'upgrade-insecure-requests': '1', 'user-agent': 'Mozilla/5.0 (Linux; Android 10)' } });
            this.api.interceptors.response.use(res => { const s = res.headers['set-cookie']; if (s) s.forEach(c => { const [n, v] = c.split(';')[0].split('='); if (n && v) this.cookies[n] = v; }); return res; });
            this.api.interceptors.request.use(c => { if (Object.keys(this.cookies).length) c.headers['Cookie'] = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; '); return c; });
        }
        async initialize() { try { await this.api.get('/'); return true; } catch { return false; } }
        async search(query) {
            try {
                await this.initialize();
                const res = await this.api.get('s', { params: { ...this.defaultParams, keyword: query, reloadNavStart: String(Date.now()) } });
                const $ = cheerio.load(res.data); let scriptWithData = '';
                $('script').each((_, el) => { const t = $(el).html(); if (t && t.includes('let data =') && t.includes('"business_data":')) scriptWithData = t; });
                const match = scriptWithData.match(/let\s+data\s*=\s*(\{[\s\S]+?\});/);
                if (!match) throw new Error('Data object not found for Douyin search.');
                const sandbox = {}; vm.createContext(sandbox); vm.runInContext(`data = ${match[1]}`, sandbox);
                const data = sandbox.data?.business_data;
                if (!data) throw new Error('Business data not found in Douyin search response.');
                return data.map(e => e?.data?.aweme_info).filter(Boolean);
            } catch (e) { console.error("Douyin Search Error:", e.message); throw e; }
        }
    }

    app.get("/api/douyin", apiKeyAuth, async (req, res) => {
        const { url: queryUrl } = req.query;
        if (!queryUrl) return res.status(400).json(loghandler.notparam("url"));
        try {
            let result;
            if (Func.isUrl(queryUrl)) {
                result = await douyinDownload(queryUrl);
            } else {
                const searcher = new DouyinSearchPage();
                result = await searcher.search(queryUrl);
            }
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.json({ status: true, creator, result });
        } catch (e) {
            res.status(500).json(loghandler.fetchError(`Douyin for query: ${queryUrl}`));
        }
    });
};