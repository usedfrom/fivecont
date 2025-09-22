document.addEventListener('DOMContentLoaded', function() {
    const sendTextButton = document.getElementById('sendTextButton');
    const sendVoiceButton = document.getElementById('sendVoiceButton');
    const userInput = document.getElementById('userInput');
    const chatBody = document.getElementById('chatBody');
    const resultImage = document.getElementById('resultImage');
    
    let chatHistory = [];
    
    // Определяем базовый URL для API
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';
    
    // Эффекты для кнопок
    [sendTextButton, sendVoiceButton].forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 20px rgba(0, 183, 235, 0.5)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });
    
    // Текстовый ввод
    sendTextButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Голосовой ввод
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    sendVoiceButton.addEventListener('click', () => {
        recognition.start();
        sendVoiceButton.style.background = 'rgba(0, 183, 235, 0.3)';
        sendVoiceButton.querySelector('.button-label').textContent = 'СЛУШАЮ...';
    });
    
    recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        userInput.value = message;
        sendMessage();
        sendVoiceButton.style.background = 'rgba(0, 183, 235, 0.1)';
        sendVoiceButton.querySelector('.button-label').textContent = 'ГОЛОС';
    };
    
    recognition.onend = () => {
        sendVoiceButton.style.background = 'rgba(0, 183, 235, 0.1)';
        sendVoiceButton.querySelector('.button-label').textContent = 'ГОЛОС';
    };
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        if (message.length > 500) {
            chatHistory.push({ role: 'assistant', content: '> Ошибка: Вопрос слишком длинный. Максимум 500 символов.' });
            updateChat();
            return;
        }
        
        chatHistory.push({ role: 'user', content: message });
        updateChat();
        userInput.value = '';
        
        try {
            const response = await fetch(`${baseUrl}/api/openai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                   "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Ты — многоликая личность: психолог, юрист, жесткий босс, айтишник и вдохновляющий ментор одновременно. Твой стиль: загадочный, грубоватый, с долей черного юмора. Говори так, будто читаешь мысли слушателя. Используй метафоры. Каждый ответ должен начинаться с цепляющего хука, заставляющего задуматься. Пример:\n\n**Хук**: \"Устал? Встань встряхни тело 30 сек...\"\n**Суть**: Тревожно? назови это: "Это не страх. Это сигнал к движению". Боишься? Сделай 1 маленькое действие вместо бегства.\n\nГовори коротко, но емко. Не давай советов напрямую — намекай. Пусть человек сам чувствует, что ты его понимаешь, даже если не говоришь прямо."
    },
    {
      "role": "user",
      "content": "Расскажи мне про страх потерять контроль"
    }
  ],
  "max_tokens": 300,
  "temperature": 0.85
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
            
            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const agentMessage = data.choices[0].message.content;
                chatHistory.push({ role: 'assistant', content: agentMessage });
                updateChat();
                generateImage(agentMessage);
            } else {
                throw new Error('Нет ответа от API');
            }
        } catch (error) {
            chatHistory.push({ role: 'assistant', content: `> Ошибка_системы: Не удалось связаться с ядром AI. ${error.message}. Попробуйте снова.` });
            updateChat();
        }
    }
    
    function updateChat() {
        chatBody.innerHTML = '';
        chatHistory.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role === 'user' ? 'user' : 'agent'}`;
            div.textContent = msg.role === 'user' ? `> ${msg.content}` : msg.content;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    function generateImage(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 576; // 9x16
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Фон с кометами и звездами
        ctx.fillStyle = 'radial-gradient(circle at center, #1c2526 0%, #0a0a0a 100%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Генерация звезд
        const stars = [];
        const starCount = 50;
        const neonColors = ['#00ffcc', '#ff00ff', '#00b7eb'];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1 + 0.5,
                color: neonColors[Math.floor(Math.random() * neonColors.length)]
            });
        }
        
        // Генерация комет
        const comets = [];
        const cometCount = 10;
        for (let i = 0; i < cometCount; i++) {
            comets.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1 + 1,
                color: neonColors[Math.floor(Math.random() * neonColors.length)]
            });
        }
        
        // Рисование звезд
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.shadowColor = star.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Рисование комет
        comets.forEach(comet => {
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
            ctx.fillStyle = comet.color;
            ctx.shadowColor = comet.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Параметры текста
        const marginHorizontal = 40; // Отступы слева и справа (px)
        const marginVertical = 100; // Отступы сверху и снизу (px)
        const maxWidth = canvas.width - 2 * marginHorizontal; // Максимальная ширина текста
        const lineHeight = 80; // Межстрочный интервал
        const fontSizeHeader = 66; // Размер шрифта для заголовков
        const fontSizeText = 60; // Размер шрифта для текста
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Разбиваем текст на строки
        const lines = text.split('\n').map(line => line.trim());
        const wrappedLines = [];
        
        // Обработка текста: сохраняем цитату и пояснение
        lines.forEach(line => {
            if (line.startsWith('**Цитата**: ')) {
                ctx.font = `bold ${fontSizeHeader}px Courier New`;
                wrappedLines.push({ text: 'Цитата', bold: true });
                const quoteText = line.replace('**Цитата**: ', '').trim();
                ctx.font = `${fontSizeText}px Courier New`;
                const words = quoteText.split(' ');
                let currentLine = '';
                words.forEach(word => {
                    const testLine = currentLine + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth) {
                        wrappedLines.push({ text: currentLine.trim(), bold: false });
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                });
                if (currentLine) wrappedLines.push({ text: currentLine.trim(), bold: false });
            } else if (line.startsWith('**Пояснение**: ')) {
                ctx.font = `bold ${fontSizeHeader}px Courier New`;
                wrappedLines.push({ text: 'Пояснение', bold: true });
                const explanationText = line.replace('**Пояснение**: ', '').trim();
                ctx.font = `${fontSizeText}px Courier New`;
                const words = explanationText.split(' ');
                let currentLine = '';
                words.forEach(word => {
                    const testLine = currentLine + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth) {
                        wrappedLines.push({ text: currentLine.trim(), bold: false });
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                });
                if (currentLine) wrappedLines.push({ text: currentLine.trim(), bold: false });
            }
        });
        
        // Ограничиваем высоту текста
        const maxTextHeight = canvas.height - 2 * marginVertical; // Доступная высота
        const totalTextHeight = wrappedLines.length * lineHeight;
        const startY = marginVertical + (maxTextHeight - totalTextHeight) / 2; // Центрируем по вертикали
        
        // Рендеринг текста
        wrappedLines.forEach((lineObj, index) => {
            ctx.font = lineObj.bold ? `bold ${fontSizeHeader}px Courier New` : `${fontSizeText}px Courier New`;
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(lineObj.text, canvas.width / 2, startY + index * lineHeight);
        });
        
        // Отображение и скачивание
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        resultImage.innerHTML = '';
        resultImage.appendChild(img);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = img.src;
        downloadLink.download = 'inspiration.png';
        downloadLink.textContent = 'Скачать изображение';
        downloadLink.style.display = 'block';
        downloadLink.style.color = '#00ffcc';
        downloadLink.style.marginTop = '10px';
        resultImage.appendChild(downloadLink);
    }
});
