const express = require('express');
const router = express.Router();
const { fetchJson, getBuffer } = require('../lib/functions');
const { lolkey, creator } = require('../config');

const loghandler = {
    noturl: { status: false, creator, code: 400, message: 'Parameter "url" tidak boleh kosong.' },
    notq: { status: false, creator, code: 400, message: 'Parameter "q" (query) tidak boleh kosong.' },
    notsurah: { status: false, creator, code: 400, message: 'Parameter "surah" tidak boleh kosong.' },
    notayat: { status: false, creator, code: 400, message: 'Parameter "ayat" tidak boleh kosong.' },
    fetchError: (service) => ({ status: false, creator, code: 500, message: `Terjadi kesalahan saat mengambil data dari ${service || 'sumber eksternal'}.` }),
};

router.get('/downloader/fbdl', async (req, res) => {
    const { url } = req.query; if (!url) return res.status(400).json(loghandler.noturl);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/dowloader/fbdown?url=${url}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("FBDL Error:", e.message); res.status(500).json(loghandler.fetchError("Facebook Downloader"));}
});
router.get('/downloader/tiktok', async (req, res) => {
    const { url } = req.query; if (!url) return res.status(400).json(loghandler.noturl);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/dowloader/tikok?url=${url}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("TikTok DL Error:", e.message); res.status(500).json(loghandler.fetchError("TikTok Downloader"));}
});
router.get('/downloader/ytplay', async (req, res) => {
    const { q } = req.query; if (!q) return res.status(400).json(loghandler.notq);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/search/ytplay?query=${q}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("YTPlay Error:", e.message); res.status(500).json(loghandler.fetchError("YouTube Play"));}
});
router.get('/downloader/ytsearch', async (req, res) => {
    const { q } = req.query; if (!q) return res.status(400).json(loghandler.notq);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/search/ytsearch?query=${q}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("YTSearch Error:", e.message); res.status(500).json(loghandler.fetchError("YouTube Search"));}
});
router.get('/downloader/ytmp3', async (req, res) => {
    const { url } = req.query; if (!url) return res.status(400).json(loghandler.noturl);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/dowloader/ytmp3?url=${url}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("YTMP3 Error:", e.message); res.status(500).json(loghandler.fetchError("YouTube MP3"));}
});
router.get('/downloader/ytmp4', async (req, res) => {
    const { url } = req.query; if (!url) return res.status(400).json(loghandler.noturl);
    try {
        const extApiResult = await fetchJson(`https://api.botcahx.biz.id/api/dowloader/ytmp4?url=${url}&apikey=Admin`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("YTMP4 Error:", e.message); res.status(500).json(loghandler.fetchError("YouTube MP4"));}
});
router.get('/islamic/jadwalsholat', async (req, res) => {
    const { q } = req.query; if (!q) return res.status(400).json(loghandler.notq);
    try {
        const extApiResult = await fetchJson(`https://api.lolhuman.xyz/api/sholat/${q}?apikey=${lolkey}`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("Jadwal Sholat Error:", e.message); res.status(500).json(loghandler.fetchError("Jadwal Sholat"));}
});
router.get('/islamic/kisahnabi', async (req, res) => {
    const { q } = req.query; if (!q) return res.status(400).json(loghandler.notq);
    try {
        const extApiResult = await fetchJson(`https://api.lolhuman.xyz/api/kisahnabi/${q}?apikey=${lolkey}`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("Kisah Nabi Error:", e.message); res.status(500).json(loghandler.fetchError("Kisah Nabi"));}
});
router.get('/islamic/niatsholat', async (req, res) => {
    const { q } = req.query; if (!q) return res.status(400).json(loghandler.notq);
    try {
        const extApiResult = await fetchJson(`https://api.lolhuman.xyz/api/niatsholat/${q}?apikey=${lolkey}`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("Niat Sholat Error:", e.message); res.status(500).json(loghandler.fetchError("Niat Sholat"));}
});
router.get('/islamic/ayat', async (req, res) => {
    const { surah, ayat } = req.query; if (!surah)return res.status(400).json(loghandler.notsurah); if(!ayat)return res.status(400).json(loghandler.notayat);
    try {
        const extApiResult = await fetchJson(`https://api.lolhuman.xyz/api/quran/${surah}/${ayat}?apikey=${lolkey}`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("Quran Ayat Error:", e.message); res.status(500).json(loghandler.fetchError("Quran Ayat"));}
});
router.get('/islamic/surah', async (req, res) => {
    const { surah } = req.query; if (!surah) return res.status(400).json(loghandler.notsurah);
    try {
        const extApiResult = await fetchJson(`https://api.lolhuman.xyz/api/quran/${surah}?apikey=${lolkey}`);
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.json({ status: true, creator, result: extApiResult.result });
    } catch (e) { console.error("Quran Surah Error:", e.message); res.status(500).json(loghandler.fetchError("Quran Surah"));}
});
router.get('/islamic/ayat-audio', async (req, res) => {
    const { surah, ayat } = req.query; if(!surah)return res.status(400).json(loghandler.notsurah);if(!ayat)return res.status(400).json(loghandler.notayat);
    try {
        const audioBuffer = await getBuffer(`https://api.lolhuman.xyz/api/quran/audio/${surah}/${ayat}?apikey=${lolkey}`);
        if (audioBuffer.error) return res.status(500).json({ status: false, message: audioBuffer.message });
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.set({'Content-Type': 'audio/mp3'}); res.send(audioBuffer);
    } catch (e) { console.error("Ayat Audio Error:", e.message); if(!res.headersSent)res.status(500).json(loghandler.fetchError("Ayat Audio"));}
});
router.get('/islamic/surah-audio', async (req, res) => {
    const { surah } = req.query; if (!surah) return res.status(400).json(loghandler.notsurah);
    try {
        const audioBuffer = await getBuffer(`https://api.lolhuman.xyz/api/quran/audio/${surah}?apikey=${lolkey}`);
        if (audioBuffer.error) return res.status(500).json({ status: false, message: audioBuffer.message });
        if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
        res.set({'Content-Type': 'audio/mp3'}); res.send(audioBuffer);
    } catch (e) { console.error("Surah Audio Error:", e.message); if(!res.headersSent)res.status(500).json(loghandler.fetchError("Surah Audio"));}
});

module.exports = router;