const axios = require("axios");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const base64EncodingUrl = (trackUrl, trackName, artistName) => Buffer.from(`__/:${trackUrl}:${trackName}:${artistName}`).toString('base64');
    const commonHeaders = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36', 'Referer': 'https://spotify-down.com/' };

    async function spotifydown(url) {
        if (!/open\.spotify\.com\/(track|album|playlist|artist)/.test(url)) throw new Error("Invalid Spotify URL. Must be a track, album, playlist, or artist URL.");
        try {
            const metadataRes = await axios.post('https://spotify-down.com/api/metadata', null, { params: { link: url }, headers: { ...commonHeaders, 'Content-Type': 'application/json' } });
            if (!metadataRes.data || !metadataRes.data.success || !metadataRes.data.data) throw new Error("Failed to fetch metadata from Spotify-Down.");
            
            const meta = metadataRes.data.data;
            // For playlists/albums, meta.links might contain individual track links
            // This example focuses on a single track for simplicity, adapt if handling playlists.
            const trackLink = meta.link || url; // Use original if meta.link is not specific enough for tracks in playlists
            const title = meta.title || "Unknown Title";
            const artists = meta.artists || "Unknown Artist";

            const base64EncodedT = base64EncodingUrl(trackLink, title, artists);
            const downloadRes = await axios.get('https://spotify-down.com/api/download', { params: { link: trackLink, n: title, a: artists, t: base64EncodedT, }, headers: commonHeaders });
            if (!downloadRes.data || !downloadRes.data.success || !downloadRes.data.data || !downloadRes.data.data.link) throw new Error("Failed to get download link from Spotify-Down.");
            
            return { metadata: meta, download_url: downloadRes.data.data.link };
        } catch (e) {
            console.error("SpotifyDL Error:", e.response?.data || e.message);
            throw new Error("Gagal mengunduh dari Spotify via Spotify-Down.");
        }
    }

    app.get("/api/spotify", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await spotifydown(url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (err) {
            res.status(500).json(loghandler.fetchError("Spotify Downloader"));
        }
    });
};