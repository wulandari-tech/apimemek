const axios = require("axios");
const WebSocket = require("ws");
const crypto = require("crypto");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const WS_URL = "wss://pixnova.ai/demo-photo2anime/queue/join"; // Same endpoint for various transformations
    const IMAGE_URL_PREFIX = "https://oss-global.pixnova.ai/";

    async function callPixNovaZombie(imageUrl, promptData, log = false) {
        let base64Image;
        if (/^https?:\/\//i.test(imageUrl)) {
            const imageBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" }).then(r => r.data).catch(() => null);
            if (!imageBuffer) throw new Error("Failed to download image for PixNova Zombie.");
            base64Image = Buffer.from(imageBuffer).toString("base64");
        } else if (Buffer.isBuffer(imageUrl)) {
            base64Image = imageUrl.toString("base64");
        } else { base64Image = imageUrl; }
        
        const sessionHash = crypto.randomBytes(5).toString("hex").slice(0, 9);
        let wss;
        return new Promise((resolve, reject) => {
            wss = new WebSocket(WS_URL);
            wss.on("open", async () => { if (log) console.log("[PixNova Zombie INFO] Connected."); await wss.send(JSON.stringify({ session_hash: sessionHash })); });
            wss.on("message", async (chunk) => {
                const data = JSON.parse(chunk.toString()); if (log) console.log("[PixNova Zombie MSG]", data);
                if (data.msg === "send_hash") {
                    const payload = { fn_index: 0, session_hash: sessionHash, data: [`data:image/jpeg;base64,${base64Image}`, promptData.prompt, promptData.negative, promptData.strength || 0.7] };
                    wss.send(JSON.stringify(payload));
                } else if (data.msg === "process_completed") {
                    if (data.output && data.output.data && data.output.data[0]) { const results = data.output.data[0].map(imgObj => IMAGE_URL_PREFIX + imgObj.name); resolve({ success: true, result: results }); }
                    else { reject(new Error("PixNova Zombie processing completed but no valid output.")); }
                    wss.close();
                } else if (data.msg === "queue_full") { reject(new Error("PixNova Zombie queue is full.")); wss.close(); }
            });
            wss.on("error", (e) => { console.error("[PixNova Zombie ERROR]", e); reject(e); });
            wss.on("close", () => { if (log) console.log("[PixNova Zombie INFO] Websocket closed."); });
        });
    }

    app.get("/api/tozombie", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const promptData = {
                prompt: "zombie, undead, decayed face, horror, blood, rotting skin, glowing eyes, terrifying, apocalypse survivor, dark atmosphere, detailed horror art, cinematic lighting, (photorealistic:1.2), (highly detailed skin:1.2)",
                negative: "cute, beautiful, clean face, low quality, blurry, watermark, cartoon, anime, sketch, colorful background, (normal human:1.3), (smooth skin:1.2)",
                strength: 0.75
            };
            const resultData = await callPixNovaZombie(url, promptData, true);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: resultData.result });
        } catch (e) {
            console.error("ToZombie API error:", e.message);
            res.status(500).json(loghandler.fetchError("PixNova ToZombie"));
        }
    });
};