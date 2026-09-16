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

export async function generateCloudflareImage(prompt, model = '@cf/stabilityai/stable-diffusion-xl-base-1.0') {
    if (!prompt) throw new Error('Prompt is required');

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN is not set. Add them to your .env file.');
    }

    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
            {
                prompt,
                negative_prompt: 'blurry, low quality, distorted, deformed, bad anatomy, watermark, text, extra limbs'
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        // Different Workers AI models respond differently: some (flux-1-schnell)
        // wrap a base64 string in a JSON envelope, others (stable-diffusion-xl-base-1.0)
        // return the raw image bytes directly. Handle both.
        const contentType = response.headers['content-type'] || '';
        let buffer;

        if (contentType.includes('application/json')) {
            const parsed = JSON.parse(Buffer.from(response.data).toString('utf8'));
            const base64Image = parsed?.result?.image;
            if (!base64Image) {
                console.error('Cloudflare Error: no image in JSON response', parsed?.errors);
                throw new Error('Cloudflare did not return an image for this prompt');
            }
            buffer = Buffer.from(base64Image, 'base64');
        } else {
            buffer = Buffer.from(response.data);
        }

        const looksLikeImage =
            buffer.length > 4 && (
                (buffer[0] === 0xFF && buffer[1] === 0xD8) ||                          // JPEG
                (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E) ||    // PNG
                (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) ||    // GIF
                (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46)       // WEBP (RIFF)
            );

        if (!looksLikeImage || buffer.length < 1000) {
            console.error('Cloudflare Error: response did not look like a valid image', { contentType, length: buffer.length });
            throw new Error('Cloudflare did not return a valid image');
        }

        return buffer;
    } catch (error) {
        let message = error.message;
        if (error.response?.data) {
            try {
                const parsed = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
                message = parsed?.errors?.[0]?.message || message;
            } catch (_) {
                // response wasn't JSON - keep the original error message
            }
        }
        console.error('Cloudflare Image Error:', message);
        throw error;
    }
}
