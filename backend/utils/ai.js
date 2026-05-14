const axios = require('axios');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const aiChat = async (messages, model = 'llama-3.3-70b-versatile') => {
  console.log(`[Groq] Sending request to ${model}...`);
  if (!process.env.GROQ_API_KEY) {
    console.error('[Groq] Error: GROQ_API_KEY is missing in process.env');
  }

  try {
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      { model, messages, temperature: 0.7 },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY?.trim()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[Groq] Success!');
    return response.data.choices[0].message.content;
  } catch (err) {
    if (err.response) {
      console.log('[Groq] API Error Status:', err.response.status);
      console.log('[Groq] API Error Data:', JSON.stringify(err.response.data));
    } else {
      console.log('[Groq] Request Error:', err.message);
    }
    throw err;
  }
};

const aiVision = async (imageBase64, prompt, mimeType = 'image/jpeg') => {
  console.log(`[Groq] Sending vision request to llama-4-scout (Mime: ${mimeType})...`);
  try {
    const response = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            }
          ]
        }],
        temperature: 0.3,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY?.trim()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('[Groq] Vision Success!');
    return response.data.choices[0].message.content;
  } catch (err) {
    if (err.response) {
      console.log('[Groq] Vision API Error Status:', err.response.status);
      console.log('[Groq] Vision API Error Data:', JSON.stringify(err.response.data));
    } else {
      console.log('[Groq] Vision Request Error:', err.message);
    }
    throw err;
  }
};

module.exports = { aiChat, aiVision };
