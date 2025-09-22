document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    const userInput = document.getElementById('userInput');
    const textButton = document.getElementById('textButton');
    const voiceButton = document.getElementById('voiceButton');
    const chatBody = document.getElementById('chatBody');
    const imageOutput = document.getElementById('imageOutput');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const downloadNoZipButton = document.getElementById('downloadNoZipButton');

    if (!userInput || !textButton || !voiceButton || !chatBody || !imageOutput || !downloadAllButton || !downloadNoZipButton) {
        console.error('Ошибка: Не найдены DOM-элементы', {
            userInput, textButton, voiceButton, chatBody, imageOutput, downloadAllButton, downloadNoZipButton
        });
        return;
    }

    let chatHistory = [];
    let imageUrls = [];

    // Анимация внеземного фона
    const alienBackground = document.querySelector('.alien-background');
    if (!alienBackground) {
        console.error('Ошибка: Не найден .alien-background');
        return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    alienBackground.appendChild(canvas);

    const energyWaves = [];
    const waveCount = 6;
    const alienColors = ['#ff0000', '#8b0000'];

    for (let i = 0; i < waveCount; i++) {
        energyWaves.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 60 + 40,
            opacity: Math.random() * 0.3 + 0.1,
            speed: Math.random() * 0.02 + 0.01
        });
    }

    function animateAlien() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        energyWaves.forEach(wave => {
            wave.radius += wave.speed;
            if (wave.radius > 100) wave.radius = 40;
            const gradient = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${wave.opacity})`);
            gradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        requestAnimationFrame(animateAlien);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    animateAlien();

    // Обработка ввода
    textButton.addEventListener('click', () => {
        console.log('Клик по кнопке отправки');
        sendMessage();
    });
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Нажат Enter');
            sendMessage();
        }
    });

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceButton.addEventListener('click', () => {
        console.log('Запуск голосового ввода');
        recognition.start();
        voiceButton.style.background = '#ff0000';
    });

    recognition.onresult = (event) => {
        const message = event.results[0][0].transcript;
        console.log('Распознан голос:', message);
        userInput.value = message;
        sendMessage();
        voiceButton.style.background = 'var(--alien-red)';
    };

    recognition.onerror = () => {
        console.error('Ошибка распознавания голоса');
        chatHistory.push({ role: 'assistant', content: '> Ошибка распознавания голоса. Попробуйте снова.' });
        updateChat();
        voiceButton.style.background = 'var(--alien-red)';
    };

    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    async function sendMessage() {
        const message = userInput.value.trim();
        console.log('Отправка сообщения:', message);
        if (!message) {
            console.warn('Пустое сообщение');
            return;
        }
        if (message.length > 500) {
            chatHistory.push({ role: 'assistant', content: '> Ошибка: Запрос слишком длинный. Максимум 500 символов.' });
            updateChat();
            return;
        }

        chatHistory.push({ role: 'user', content: message });
        updateChat();
        userInput.value = '';
        imageUrls = [];
        downloadAllButton.style.display = 'none';
        downloadNoZipButton.style.display = 'none';

        let systemPrompt = '';
        let isContentMode = false;
        if (message.toLowerCase().startsWith('контент')) {
            isContentMode = true;
            const topic = message.slice(7).trim() || 'случайная тема';
            systemPrompt = `Ты — генератор реального контента. Для запроса "${topic}" выбери одну случайную тему (формулы, книги, наука, история) и сгенерируй 6 абзацев с реальными фактами по этой теме. Формат: "[Тема в кавычках или формула].\nОбъяснение: [Краткое, понятное объяснение].\nP.S.: [Факт]."
Примеры:
1. Формула остановки времени: "Внимание х Новизна = Растяжение времени"\nОбъяснение: Новый опыт замедляет время. Первый поцелуй — вечность, тысячный — секунда.\nP.S.: Эйнштейн каждый день пробовал новое.
2. "Подпольный интернет" — Джейми Бартлетт\nОбъяснение: Книга про даркнет и криптовалюты. Свобода и преступность переплетаются.\nP.S.: Бартлетт — журналист, изучающий цифровые миры.
3. Квантовая запутанность\nОбъяснение: Частицы связаны на расстоянии. Изменение одной влияет на другую.\nP.S.: Эйнштейн называл это "жутким действием".
4. Парадокс выбора — "Свобода х Варианты = Паралич"\nОбъяснение: Чем больше вариантов — тем сложнее выбрать. Свобода может превратиться в пытку.\nP.S.: Барри Шварц написал книгу «Парадокс выбора» — бестселлер в психологии.
5. Эффект “Зомби-компьютера” — "Сон х Экран = Бессознательное действие"\nОбъяснение: Люди продолжают листать ленту, даже когда уже спят — мозг на автопилоте.\nP.S.: Исследования MIT показали: 70% пользователей делают это ежедневно.
6. “Синдром разбитых окон” — "Беспорядок х Безнаказанность = Рост преступности"\nОбъяснение: Если не чинить мелкие нарушения — растёт уровень серьёзных преступлений.\nP.S.: Применялся в Нью-Йорке в 90-х. Преступность упала на 75%.
Отвечай на русском, кратко, ёмко, понятно.`;
        } else {
            systemPrompt = 'Ты — AI-психолог с юмором. Отвечай: \n\n[Что если]: [Остроумная фраза].\n\n[Значит]: [Мотивирующее объяснение].';
        }

        try {
            console.log('Отправка запроса к API:', baseUrl + '/api/openai');
            const response = await fetch(`${baseUrl}/api/openai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...chatHistory
                    ],
                    max_tokens: isContentMode ? 600 : 200,
                    temperature: 0.8
                })
            });

            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
            const data = await response.json();
            console.log('Ответ от API:', data);
            if (data.choices && data.choices[0]) {
                const agentMessage = data.choices[0].message.content;
                chatHistory.push({ role: 'assistant', content: agentMessage });
                updateChat();
                if (isContentMode) {
                    const paragraphs = agentMessage.split('\n\n').filter(p => p.trim());
                    distributeTextOnImages(paragraphs);
                    generateSubscriptionImage();
                    downloadAllButton.style.display = 'block';
                    downloadNoZipButton.style.display = 'block';
                } else {
                    generateImage(agentMessage, 0);
                }
            } else {
                throw new Error('Нет ответа от API');
            }
        } catch (error) {
            console.error('Ошибка API:', error);
            chatHistory.push({ role: 'assistant', content: `> Ошибка: Не удалось связаться с AI. ${error.message}.` });
            updateChat();
        }
    }

    function updateChat() {
        chatBody.innerHTML = '';
        chatHistory.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.role}`;
            div.textContent = `> ${msg.content}`;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function generateUniqueBackground(imgCtx, width, height) {
        const gradient = imgCtx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, '#1a0000');
        gradient.addColorStop(1, '#000000');
        imgCtx.fillStyle = gradient;
        imgCtx.fillRect(0, 0, width, height);

        const waveCount = Math.floor(Math.random() * 3 + 3);
        for (let i = 0; i < waveCount; i++) {
            const gradient = imgCtx.createRadialGradient(
                Math.random() * width,
                Math.random() * height,
                0,
                Math.random() * width,
                Math.random() * height,
                Math.random() * 50 + 30
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, ${Math.random() * 0.2 + 0.1})`);
            gradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
            imgCtx.beginPath();
            imgCtx.arc(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 50 + 30,
                0, Math.PI * 2
            );
            imgCtx.fillStyle = gradient;
            imgCtx.fill();
        }
    }

    function distributeTextOnImages(paragraphs) {
        imageOutput.innerHTML = '';
        const images = [[], [], [], [], [], [], []];
        let currentImage = 0;

        paragraphs.forEach(paragraph => {
            if (currentImage < 7) {
                const lines = paragraph.split('\n').filter(line => line.trim());
                images[currentImage].push(...lines);
                currentImage++;
            }
        });

        // Распределяем оставшиеся строки, если абзацев меньше 7
        if (currentImage < 7 && paragraphs.length > 0) {
            const remainingLines = paragraphs.join('\n').split('\n').filter(line => line.trim());
            let lineIndex = 0;
            while (currentImage < 7 && lineIndex < remainingLines.length) {
                images[currentImage].push(remainingLines[lineIndex]);
                lineIndex++;
                currentImage++;
            }
        }

        images.forEach((imageLines, index) => {
            if (imageLines.length > 0) generateImage(imageLines.join('\n'), index);
        });
    }

    function generateImage(text, index) {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = 540;
        imgCanvas.height = 540;
        const imgCtx = imgCanvas.getContext('2d');

        generateUniqueBackground(imgCtx, 540, 540);

        imgCtx.textAlign = 'left';
        imgCtx.textBaseline = 'top';
        const lines = text.split('\n').filter(line => line.trim());
        let y = 30;
        const maxWidth = 460;
        const lineHeight = 32;

        lines.forEach(line => {
            if (line.match(/^["'].*["']|^[^ОбъяснениеP.S.:].*/)) {
                imgCtx.font = 'bold 24px "Arial Black"';
                imgCtx.fillStyle = '#ff0000';
            } else {
                imgCtx.font = 'bold 20px "Courier New"';
                imgCtx.fillStyle = '#f0f0f0';
            }
            const words = line.split(' ');
            let currentLine = '';
            for (let word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = imgCtx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    imgCtx.fillText(currentLine, 40, y);
                    currentLine = word + ' ';
                    y += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            imgCtx.fillText(currentLine, 40, y);
            y += lineHeight * 1.2;
        });

        const img = new Image();
        img.src = imgCanvas.toDataURL('image/png');
        imageUrls.push({ src: img.src, name: `content_${index + 1}.png` });

        const imgContainer = document.createElement('div');
        imgContainer.className = 'carousel-item';
        imgContainer.appendChild(img);

        const downloadLink = document.createElement('a');
        downloadLink.href = img.src;
        downloadLink.download = `content_${index + 1}.png`;
        downloadLink.textContent = 'Скачать';
        downloadLink.style.display = 'block';
        downloadLink.style.color = 'var(--alien-red)';
        downloadLink.style.marginTop = '0.5rem';
        imgContainer.appendChild(downloadLink);

        imageOutput.appendChild(imgContainer);
    }

    function generateSubscriptionImage() {
        const subscriptionMessages = [
            'Мы больше не пересечёмся — если ты не подпишешься. Это твой последний шанс меня увидеть.',
            'Ты не увидишь меня снова — если не нажмёшь “подписаться”. Решай.',
            'Это — последний раз, когда ты меня видишь. Если не подпишешься.',
            'Мы не встретимся в ленте — если ты не подпишешься сейчас.',
            'Ты пролистнешь — и я исчезну из твоей жизни. Подпишись, пока не поздно.',
            'Если ты не подпишешься — я просто перестану для тебя существовать.',
            'Ты не увидишь, что будет дальше — если не подпишешься. Это факт.',
            'Мы больше не увидимся. Точнее — ты меня не увидишь. Подпишись, и я останусь.',
            'Алгоритм не покажет меня тебе снова — если ты не подпишешься прямо сейчас.',
            'Это конец. Если ты не подпишешься — ты меня больше не найдёшь.'
        ];
        const randomMessage = subscriptionMessages[Math.floor(Math.random() * subscriptionMessages.length)];

        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = 540;
        imgCanvas.height = 540;
        const imgCtx = imgCanvas.getContext('2d');

        generateUniqueBackground(imgCtx, 540, 540);

        imgCtx.textAlign = 'left';
        imgCtx.textBaseline = 'top';
        let y = 30;
        const maxWidth = 460;
        const lineHeight = 32;

        // Отрисовка "Поставь Лайк ведь:" в красном цвете
        imgCtx.font = 'bold 24px "Arial Black"';
        imgCtx.fillStyle = '#ff0000';
        let currentLine = 'Поставь Лайк ведь:';
        imgCtx.fillText(currentLine, 40, y);
        y += lineHeight * 1.2;

        // Отрисовка случайного сообщения в белом цвете
        imgCtx.font = 'bold 20px "Courier New"';
        imgCtx.fillStyle = '#f0f0f0';
        const lines = randomMessage.split('\n').length > 1 ? randomMessage.split('\n') : randomMessage.match(/.{1,30}(\s|$)/g);
        lines.forEach(line => {
            const words = line.split(' ');
            currentLine = '';
            for (let word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = imgCtx.measureText(testLine);
                if (metrics.width > maxWidth) {
                    imgCtx.fillText(currentLine, 40, y);
                    currentLine = word + ' ';
                    y += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            imgCtx.fillText(currentLine, 40, y);
            y += lineHeight * 1.2;
        });

        const img = new Image();
        img.src = imgCanvas.toDataURL('image/png');
        imageUrls.push({ src: img.src, name: 'subscribe.png' });

        const imgContainer = document.createElement('div');
        imgContainer.className = 'carousel-item';
        imgContainer.appendChild(img);

        const downloadLink = document.createElement('a');
        downloadLink.href = img.src;
        downloadLink.download = 'subscribe.png';
        downloadLink.textContent = 'Скачать';
        downloadLink.style.display = 'block';
        downloadLink.style.color = 'var(--alien-red)';
        downloadLink.style.marginTop = '0.5rem';
        imgContainer.appendChild(downloadLink);

        imageOutput.appendChild(imgContainer);
    }

    downloadAllButton.addEventListener('click', () => {
        console.log('Скачивание всех изображений (ZIP)');
        const zip = new JSZip();
        Promise.all(imageUrls.map(({ src, name }) =>
            fetch(src)
                .then(response => response.blob())
                .then(blob => zip.file(name, blob))
        )).then(() => {
            zip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, 'content_images.zip');
            });
        });
    });

    downloadNoZipButton.addEventListener('click', () => {
        console.log('Скачивание всех изображений (без ZIP)');
        imageUrls.forEach(({ src, name }) => {
            const link = document.createElement('a');
            link.href = src;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
});
