const axios = require('axios');
const cheerio = require('cheerio');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    async function detailHero(heroName) {
        const url = `https://mobile-legends.fandom.com/wiki/${encodeURIComponent(heroName)}`;
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const heroData = {
                title: $('h1.page-header__title').text().trim() || "Not Found",
                role: $('div[data-source="role"] .pi-data-value').text().trim() || "N/A",
                speciality: $('div[data-source="specialty"] .pi-data-value').text().trim() || "N/A",
                lane: $('div[data-source="lane"] .pi-data-value').text().trim() || "N/A"
            };
            if (heroData.title === "Not Found") throw new Error("Hero details not found on fandom page.");
            return heroData;
        } catch (e) {
            console.error(`Failed to fetch ML Hero ${heroName}:`, e.message);
            throw new Error(`Could not retrieve details for hero: ${heroName}`);
        }
    }

    app.get("/api/heroml", apiKeyAuth, async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json(loghandler.notparam("q (hero name)"));
            const result = await detailHero(q);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (e) {
            res.status(500).json(loghandler.fetchError(`ML Hero Detail for ${req.query.q || 'unknown'}`));
        }
    });
};