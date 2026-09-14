import axios from 'axios';

const GEMINI_MODEL = 'gemini-3.5-flash';

async function queryGemini(prompt) {
    if (!prompt) throw new Error('Question is required');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
    }

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                timeout: 30000
            }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from Gemini');
        return text;
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data?.error?.message || error.message);
        throw error;
    }
}

export async function callGeminiAPI(prompt) {
    return queryGemini(prompt);
}

export async function generatePollinationsImage(prompt) {
    if (!prompt) throw new Error('Prompt is required');

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        const buffer = Buffer.from(response.data);
        const contentType = response.headers['content-type'] || '';
        const looksLikeImage =
            contentType.startsWith('image/') ||
            (buffer.length > 4 && (
                (buffer[0] === 0xFF && buffer[1] === 0xD8) ||                          // JPEG
                (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E) ||    // PNG
                (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||    // GIF
                (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46)       // WEBP (RIFF)
            ));

        if (!looksLikeImage || buffer.length < 1000) {
            console.error('Pollinations Error: response did not look like a valid image', {
                contentType,
                length: buffer.length
            });
            throw new Error('Pollinations did not return a valid image');
        }

        return buffer;
    } catch (error) {
        console.error('Pollinations Error:', error.message);
        throw error;
    }
}
