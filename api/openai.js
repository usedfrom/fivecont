const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://postertest.vercel.app' : 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const proxyUrl = process.env.PROXY_URL;

if (!OPENAI_API_KEY || !proxyUrl) {
    console.error('Ошибка: OPENAI_API_KEY или PROXY_URL не заданы');
    throw new Error('Необходимы переменные окружения OPENAI_API_KEY и PROXY_URL');
}

const agent = new HttpsProxyAgent(proxyUrl);

module.exports = async (req, res) => {
    console.log('Получен запрос на /api/openai:', req.body);
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            httpsAgent: agent
        });
        console.log('Успешный ответ от OpenAI:', response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Ошибка API:', error.message, error.response ? error.response.data : '');
        res.status(500).json({ error: 'API Error', details: error.message });
    }
};
