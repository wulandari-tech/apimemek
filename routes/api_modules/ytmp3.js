const axios = require("axios");
const crypto = require("crypto");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const api = { base: "https://media.savetube.me/api", cdn: "/random-cdn", info: "/v2/info", download: "/download" };
    const headers = { accept: "*/*", "content-type": "application/json", origin: "https://yt.savetube.me", referer: "https://yt.savetube.me/", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" };

    async function savetube(link, format = "mp3") {
        const hexToBuffer = (hex) => Buffer.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const decrypt = async (enc) => {
            const key = hexToBuffer("C5D58EF67A7584E4A29F6C35BBC4EB12"); const data = Buffer.from(enc, "base64"), iv = data.slice(0, 16), content = data.slice(16);
            const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv); const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
            return JSON.parse(decrypted.toString());
        };
        const isUrlValid = (str) => { try { new URL(str); return true; } catch { return false; } };
        const getYoutubeId = (url) => { if (!url) return null; const regexps = [ /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/, /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, /youtu\.be\/([a-zA-Z0-9_-]{11})/, ]; for (const r of regexps) if (r.test(url)) return url.match(r)[1]; return null; };
        const request = async (endpoint, data = {}, method = "post") => { try { const res = await axios({ method, url: `${endpoint.startsWith("http") ? "" : api.base}${endpoint}`, data: method === "post" ? data : undefined, params: method === "get" ? data : undefined, headers }); return { status: true, code: 200, data: res.data }; } catch (e) { return { status: false, code: e.response?.status || 500, error: e.message }; } };
        const getCDN = async () => { const r = await request(api.cdn, {}, "get"); if (!r.status) throw new Error("Failed to get CDN from SaveTube."); return r.data.cdn; };
        
        if (!link) throw new Error("Parameter 'link' (YouTube URL) is required.");
        if (!isUrlValid(link)) throw new Error("Invalid YouTube URL provided.");
        const id = getYoutubeId(link);
        if (!id) throw new Error("Could not extract YouTube video ID from the URL.");
        
        const cdn = await getCDN();
        const infoResult = await request(`https://${cdn}${api.info}`, { url: `https://www.youtube.com/watch?v=${id}` });
        if (!infoResult.status || !infoResult.data.data) throw new Error(`Failed to get video info from SaveTube: ${infoResult.error || 'No data'}`);
        
        const decryptedInfo = await decrypt(infoResult.data.data);
        if (!decryptedInfo.key) throw new Error("Decrypted info key missing from SaveTube response.");

        const dlResult = await request(`https://${cdn}${api.download}`, { id, downloadType: "audio", quality: "128", key: decryptedInfo.key });
        if (!dlResult.status || !dlResult.data.data || !dlResult.data.data.downloadUrl) throw new Error(`Failed to get download link from SaveTube: ${dlResult.error || 'No downloadUrl'}`);
        
        const timeFormat = (v) => { let s=parseInt(v,10),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),S=s%60; return(h?(h<10?"0"+h:h)+":":"")+(m<10?"0"+m:m)+":"+(S<10?"0"+S:S); };
        return { title: decryptedInfo.title || "Unknown Title", id, duration: timeFormat(decryptedInfo.duration), youtube_url: `https://youtube.com/watch?v=${id}`, download_url: dlResult.data.data.downloadUrl };
    }

    app.get("/api/ytmp3", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await savetube(url, "mp3");
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            console.error("YTMP3 (SaveTube) Error:", error.message);
            res.status(500).json(loghandler.fetchError("YouTube MP3 (SaveTube)"));
        }
    });
};