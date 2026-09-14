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

export async function generateCloudflareImage(prompt) {
    if (!prompt) throw new Error('Prompt is required');

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN is not set. Add them to your .env file.');
    }

    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                prompt
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const base64Image = response.data?.result?.image;
        if (!base64Image) {
            console.error('Cloudflare Error: no image in response', response.data?.errors);
            throw new Error('Cloudflare did not return an image for this prompt');
        }

        const buffer = Buffer.from(base64Image, 'base64');
        const looksLikeImage =
            buffer.length > 4 && (
                (buffer[0] === 0xFF && buffer[1] === 0xD8) ||                          // JPEG
                (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E) ||    // PNG
                (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||    // GIF
                (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46)       // WEBP (RIFF)
            );

        if (!looksLikeImage || buffer.length < 1000) {
            console.error('Cloudflare Error: decoded data did not look like a valid image', { length: buffer.length });
            throw new Error('Cloudflare did not return a valid image');
        }

        return buffer;
    } catch (error) {
        console.error('Cloudflare Image Error:', error.response?.data?.errors?.[0]?.message || error.message);
        throw error;
    }
}
