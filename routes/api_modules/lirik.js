const axios = require('axios');
const cheerio = require('cheerio');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    async function lirik(title) {
        try {
            const searchUrl = `https://genius.com/api/search/song?q=${encodeURIComponent(title)}`;
            const searchRes = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
            const song = searchRes.data.response.sections[0]?.hits[0]?.result;
            if (!song || !song.url) throw new Error("Song not found on Genius.");

            const lyricsRes = await axios.get(song.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
            const $ = cheerio.load(lyricsRes.data);
            
            let lyricsHtml = '';
            $('div[class^="Lyrics__Container"], div[data-lyrics-container="true"]').each((i, elem) => {
                lyricsHtml += $(elem).html();
            });
             if (!lyricsHtml) throw new Error("Lyrics container not found on Genius page.");

            const lyricsText = cheerio.load(`<div>${lyricsHtml.replace(/<br\s*\/?>/gi, '\n')}</div>`)('div').text().trim();
            const cleanedLyrics = lyricsText
                .replace(/\[[^\]]*\]/g, (match) => `\n\n${match.trim()}\n`) // Add newlines around sections like [Verse], [Chorus]
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to two
                .replace(/^\s+|\s+$/g, ''); // Trim leading/trailing whitespace

            return {
                title: song.title,
                author: song.primary_artist.name,
                url: song.url,
                image: song.header_image_thumbnail_url || song.song_art_image_thumbnail_url,
                release_date: song.release_date_for_display,
                lyrics: cleanedLyrics
            };
        } catch (e) {
            console.error("Lirik Genius Error:", e.message);
            throw new Error(`Failed to fetch lyrics for "${title}".`);
        }
    }

    app.get("/api/genius", apiKeyAuth, async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json(loghandler.notparam("q (song title)"));
            const result = await lirik(q);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Genius Lyrics"));
        }
    });
};