import axios from 'axios';

const GEMINI_MODEL = 'gemini-3.5-flash';

export async function geminiVision2(imageBase64, query) {
  if (!imageBase64 || !query) {
    throw new Error('Image data and query are required');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: cleanBase64
                }
              },
              {
                text:
                  'You are a helpful AI assistant analyzing media for users. Provide practical, actionable, and useful information.\n\nUser question: ' +
                  query
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        timeout: 30000
      }
    );

    const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Failed to analyze image');
    }

    return text;
  } catch (error) {
    console.error('Gemini Vision Error:', error.response?.data?.error?.message || error.message);
    throw error;
  }
}
