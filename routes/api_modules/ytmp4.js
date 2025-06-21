const axios = require("axios"); // Added axios

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;

    async function ytmp3mobi(youtubeUrl, format = "mp4") {
        const regYoutubeId = /https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^&|^?#]+)/;
        const videoId = youtubeUrl.match(regYoutubeId)?.[1]; // Changed index to 1
        if (!videoId) throw new Error("Can't extract YouTube video ID. Please check your URL.");
        
        const availableFormat = ["mp3", "mp4"];
        const formatIndex = availableFormat.findIndex(v => v === format.toLowerCase());
        if (formatIndex === -1) throw new Error(`${format} is invalid. Available: ${availableFormat.join(", ")}.`);
        
        const urlParam = { v: videoId, f: format, _: Math.random().toString().slice(2,12) }; // Added random string
        const headers = { "Referer": "https://id.ytmp3.mobi/", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" };

        const fetchJsonWithAxios = async (url, description) => { // Using Axios
            try {
                const res = await axios.get(url, { headers });
                if (res.status !== 200) throw new Error(`Fetch failed on ${description} | ${res.status} ${res.statusText}`);
                return res.data;
            } catch (e) {
                console.error(`Error fetching ${description} from ${url}:`, e.message);
                throw e;
            }
        };
        
        const initData = await fetchJsonWithAxios("https://d.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=" + Math.random().toString().slice(2,12), "get convertURL");
        if (!initData || !initData.convertURL) throw new Error("Failed to initialize ytmp3.mobi: convertURL not found.");
        const { convertURL } = initData;

        const progressData = await fetchJsonWithAxios(`${convertURL}&${new URLSearchParams(urlParam).toString()}`, "get progressURL and downloadURL");
        if (!progressData || !progressData.progressURL || !progressData.downloadURL) throw new Error("Failed to get progress/download URL from ytmp3.mobi.");
        let { progressURL, downloadURL, title } = progressData; // Title is often in this response
        
        let currentProgressData = {}; let attempts = 0;
        while (currentProgressData.progress !== 3 && attempts < 20) { // Added attempt limit
            currentProgressData = await fetchJsonWithAxios(progressURL, "fetch progressURL");
            if (currentProgressData.error) throw new Error(`Error from ytmp3.mobi progress: ${currentProgressData.error}`);
            title = currentProgressData.title || title; // Update title if available
            let statusToPrint = currentProgressData.progress == 1 ? "[loading]" : currentProgressData.progress == 2 ? "[converting]" : currentProgressData.progress == 3 ? "[ready]" : "[unknown]";
            console.log(`${statusToPrint} ${title || videoId}`);
            if (currentProgressData.progress !== 3) await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before polling again
            attempts++;
        }
        if (currentProgressData.progress !== 3) throw new Error("Video conversion timed out or failed at ytmp3.mobi.");

        return { title: title || "Unknown Title", download_url: downloadURL };
    }

    app.get("/api/ytmp4", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const result = await ytmp3mobi(url, "mp4");
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            console.error("YTMP4 (ytmp3.mobi) Error:", error.message);
            res.status(500).json(loghandler.fetchError("YouTube MP4 (ytmp3.mobi)"));
        }
    });
};