const axios = require("axios");
const WebSocket = require("ws");
const crypto = require("crypto");

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const WS_URL = "wss://pixnova.ai/demo-photo2anime/queue/join";
    const IMAGE_URL_PREFIX = "https://oss-global.pixnova.ai/"; // Added prefix

    async function callPixNova(imageUrl, promptData, log = false) {
        let base64Image;
        if (/^https?:\/\//i.test(imageUrl)) {
            const imageBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" }).then(r => r.data).catch(() => null);
            if (!imageBuffer) throw new Error("Failed to download image for PixNova.");
            base64Image = Buffer.from(imageBuffer).toString("base64");
        } else if (Buffer.isBuffer(imageUrl)) {
            base64Image = imageUrl.toString("base64");
        } else {
            base64Image = imageUrl; // Assuming already base64
        }
        
        const sessionHash = crypto.randomBytes(5).toString("hex").slice(0, 9);
        let wss;

        return new Promise((resolve, reject) => {
            wss = new WebSocket(WS_URL);
            let taskPromiseResolver;

            wss.on("open", async () => {
                if (log) console.log("[PixNova INFO] Connected to websocket.");
                await wss.send(JSON.stringify({ session_hash: sessionHash })); // Send initial session
            });

            wss.on("message", async (chunk) => {
                const data = JSON.parse(chunk.toString());
                if (log) console.log("[PixNova MSG]", data);

                if (data.msg === "send_hash") { // After initial send_hash confirmation
                    const payload = {
                        fn_index: 0, // Assuming fn_index is always 0 for this task
                        session_hash: sessionHash,
                        data: [
                            `data:image/jpeg;base64,${base64Image}`,
                            promptData.prompt,
                            promptData.negative,
                            promptData.strength || 0.65
                        ]
                    };
                    wss.send(JSON.stringify(payload));
                } else if (data.msg === "estimation") {
                    // Handle estimation if needed, e.g., show progress
                } else if (data.msg === "process_starts") {
                    // Process starts
                } else if (data.msg === "process_completed") {
                    if (data.output && data.output.data && data.output.data[0]) {
                       const results = data.output.data[0].map(imgObj => IMAGE_URL_PREFIX + imgObj.name); // Construct full URL
                        resolve({ success: true, result: results });
                    } else {
                        reject(new Error("PixNova processing completed but no valid output data."));
                    }
                    wss.close();
                } else if (data.msg === "queue_full") {
                    reject(new Error("PixNova queue is full. Please try again later."));
                    wss.close();
                }
            });
            wss.on("error", (e) => { console.error("[PixNova ERROR]", e); reject(e); });
            wss.on("close", () => { if (log) console.log("[PixNova INFO] Websocket closed."); });
        });
    }

    app.get("/api/toanime", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const promptData = {
                prompt: "(masterpiece), (best quality), (anime style), vibrant colors, soft lighting, highly detailed, aesthetic background, dynamic composition, beautiful face, anime eyes, cinematic shading",
                negative: "(low quality:1.4), blurry, cropped, watermark, text, logo, extra fingers, extra limbs, bad anatomy, sketch, monochrome, grayscale",
                strength: 0.65
            };
            const result = await callPixNova(url, promptData, true); // Enable logging for PixNova
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: result.result });
        } catch (e) {
            console.error("ToAnime API error:", e.message);
            res.status(500).json(loghandler.fetchError("PixNova ToAnime"));
        }
    });
};