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

// Gemini's API doesn't serve actual Llama models - there's no free official
// equivalent, so this now runs on the same real Gemini backend as
// callGeminiAPI above (it already worked this way before, just against a
// dead endpoint). Swap this out if you get a dedicated Llama provider later.
export async function callLlamaAPI(prompt) {
    return queryGemini(prompt);
}
