const axios = require('axios');
const FormData = require('form-data');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { groq, loghandler, creator } = configObjects; // Get groq key from configObjects

    async function transkrip(audioUrl) {
        if (!groq || !groq.key) throw new Error("Groq API key is not configured.");
        try {
            const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const form = new FormData();
            form.append('file', response.data, { filename: 'audio.mp3', contentType: 'audio/mpeg' });
            form.append('model', 'whisper-large-v3');
            
            const { data: transcriptionData } = await axios.post(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                form,
                { headers: { ...form.getHeaders(), 'Authorization': `Bearer ${groq.key}` } }
            );
            if (!transcriptionData || typeof transcriptionData.text === 'undefined') throw new Error("Invalid response structure from Groq Whisper API.");
            return transcriptionData.text;
        } catch (error) {
            console.error('Whisper Transcription Error:', error.response?.data?.error?.message || error.message);
            throw new Error(`Failed to transcribe audio: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    app.get("/api/whisper", apiKeyAuth, async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json(loghandler.notparam("url"));
            const hasilTranskrip = await transkrip(url);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result: hasilTranskrip });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Whisper Audio Transcription"));
        }
    });
};