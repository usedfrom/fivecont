document.addEventListener('DOMContentLoaded', function() {
    const marqueeModal = document.getElementById('marqueeModal');
    const marqueeText = document.getElementById('marqueeText');
    const useAIText = document.getElementById('useAIText');
    const marqueeSpeed = document.getElementById('marqueeSpeed');
    const fontColor = document.getElementById('fontColor');
    const fontFamily = document.getElementById('fontFamily');
    const fontSize = document.getElementById('fontSize');
    const effectType = document.getElementById('effectType');
    const backgroundImage = document.getElementById('backgroundImage');
    const marqueePreview = document.getElementById('marqueePreview');
    const saveVideo = document.getElementById('saveVideo');
    const videoDuration = document.getElementById('videoDuration');
    const closeMarqueeModal = document.getElementById('closeMarqueeModal');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');

    if (!marqueeModal || !marqueeText || !useAIText || !marqueeSpeed || !fontColor || !fontFamily || !fontSize || !effectType || !backgroundImage || !marqueePreview || !saveVideo || !videoDuration || !closeMarqueeModal || !progressBar || !progress) {
        console.error('Ошибка: Не найдены элементы модального окна');
        return;
    }

    const width = 5120;
    const height = 1080;
    let xPos = width;
    let backgroundSprite = null;
    let textSprite = null;
    let animationFrame = null;

    // Инициализация PixiJS
    const app = new PIXI.Application({
        view: marqueePreview,
        width: width,
        height: height,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });

    // Создание контейнера для эффектов
    const container = new PIXI.Container();
    app.stage.addChild(container);

    // Дефолтный фон
    function generateUniqueBackground() {
        const graphics = new PIXI.Graphics();
        const gradient = new PIXI.FillGradient(0, 0, width, height);
        gradient.addColorStop(0, 0x1a0000);
        gradient.addColorStop(1, 0x000000);
        graphics.beginFill(gradient);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();

        for (let i = 0; i < 3; i++) {
            const circle = new PIXI.Graphics();
            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const radius = 50;
            const circleGradient = new PIXI.FillGradient(cx, cy, cx, cy);
            circleGradient.addColorStop(0, 0xff0000, 0.2);
            circleGradient.addColorStop(1, 0x8b0000, 0);
            circle.beginFill(circleGradient);
            circle.drawCircle(cx, cy, radius);
            circle.endFill();
            graphics.addChild(circle);
        }

        const texture = app.renderer.generateTexture(graphics);
        const sprite = new PIXI.Sprite(texture);
        sprite.width = width;
        sprite.height = height;
        return sprite;
    }

    // Инициализация фона
    backgroundSprite = generateUniqueBackground();
    container.addChild(backgroundSprite);

    // Инициализация текста
    textSprite = new PIXI.Text('Подпишись!', {
        fontFamily: fontFamily.value,
        fontSize: parseInt(fontSize.value),
        fill: fontColor.value,
        align: 'left'
    });
    textSprite.x = xPos;
    textSprite.y = height / 2;
    textSprite.anchor.set(0, 0.5);
    container.addChild(textSprite);

    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    // Загрузка пользовательского фона
    backgroundImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const texture = PIXI.Texture.from(img);
                    backgroundSprite.texture = texture;
                    backgroundSprite.width = width;
                    backgroundSprite.height = height;
                    const imgRatio = img.width / img.height;
                    const canvasRatio = width / height;
                    if (imgRatio > canvasRatio) {
                        backgroundSprite.height = height;
                        backgroundSprite.width = height * imgRatio;
                        backgroundSprite.x = (width - backgroundSprite.width) / 2;
                    } else {
                        backgroundSprite.width = width;
                        backgroundSprite.height = width / imgRatio;
                        backgroundSprite.y = (height - backgroundSprite.height) / 2;
                    }
                    if (!animationFrame) animateMarquee();
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // Генерация текста от AI
    useAIText.addEventListener('click', async () => {
        try {
            const response = await fetch(`${baseUrl}/api/openai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'Сгенерируй короткий (до 50 символов) призыв к действию для подписки на тему (например, "Подпишись на космос!").' },
                        { role: 'user', content: 'Призыв к подписке' }
                    ],
                    max_tokens: 50,
                    temperature: 0.8
                })
            });
            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
            const data = await response.json();
            if (data.choices && data.choices[0]) {
                marqueeText.value = data.choices[0].message.content.slice(0, 50);
                updateText();
                xPos = width;
                if (!animationFrame) animateMarquee();
            }
        } catch (error) {
            console.error('Ошибка получения текста AI:', error);
            marqueeText.value = 'Ошибка при загрузке текста AI';
            updateText();
        }
    });

    // Ограничение текста до 50 символов
    marqueeText.addEventListener('input', () => {
        if (marqueeText.value.length > 50) {
            marqueeText.value = marqueeText.value.slice(0, 50);
        }
        updateText();
        xPos = width;
        if (!animationFrame) animateMarquee();
    });

    // Обновление текста
    function updateText() {
        textSprite.text = marqueeText.value || 'Подпишись!';
        textSprite.style.fontFamily = fontFamily.value;
        textSprite.style.fontSize = parseInt(fontSize.value);
        textSprite.style.fill = fontColor.value;
    }

    // Применение эффектов
    function applyEffect(time) {
        textSprite.filters = [];
        switch (effectType.value) {
            case 'glow':
                textSprite.filters = [new PIXI.filters.GlowFilter({ color: parseInt(fontColor.value.slice(1), 16), distance: 10 })];
                break;
            case 'pulse':
                textSprite.scale.set(1 + Math.sin(time * 0.005) * 0.1);
                break;
            case 'bounce':
                textSprite.y = height / 2 + Math.sin(time * 0.01) * 20;
                break;
            case 'fade':
                textSprite.alpha = 0.5 + Math.sin(time * 0.005) * 0.5;
                break;
            case 'rotate':
                textSprite.rotation = Math.sin(time * 0.005) * 0.2;
                break;
            case 'wave':
                textSprite.y = height / 2 + Math.sin(textSprite.x * 0.01 + time * 0.005) * 20;
                break;
            case 'blink':
                textSprite.alpha = Math.abs(Math.sin(time * 0.01));
                break;
            case 'scale':
                textSprite.scale.set(1 + Math.sin(time * 0.005) * 0.2, 1);
                break;
            case 'skew':
                textSprite.skew.set(Math.sin(time * 0.005) * 0.2, 0);
                break;
        }
    }

    // Анимация бегущей строки
    function animateMarquee() {
        xPos -= parseInt(marqueeSpeed.value);
        if (xPos < -textSprite.width) {
            xPos = width;
        }
        textSprite.x = xPos;
        applyEffect(performance.now());
        animationFrame = requestAnimationFrame(animateMarquee);
    }

    // Обработчики изменений настроек
    [marqueeSpeed, fontColor, fontFamily, fontSize, effectType].forEach(input => {
        input.addEventListener('input', () => {
            updateText();
            xPos = width;
            if (!animationFrame) animateMarquee();
        });
    });

    // Закрытие модального окна
    closeMarqueeModal.addEventListener('click', () => {
        marqueeModal.style.display = 'none';
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    });

    // Экспорт видео
    saveVideo.addEventListener('click', async () => {
        saveVideo.disabled = true;
        saveVideo.textContent = 'Генерация...';
        progressBar.style.display = 'block';
        progress.style.width = '0%';
        try {
            const duration = parseInt(videoDuration.value);
            const fps = 30;
            const frames = duration * fps;
            const frameData = [];

            for (let i = 0; i < frames; i++) {
                xPos = width - (i * parseInt(marqueeSpeed.value) % (width + textSprite.width));
                textSprite.x = xPos;
                applyEffect(i * 1000 / fps);
                frameData.push(app.renderer.extract.canvas(app.stage).toDataURL('image/png'));
                progress.style.width = `${(i + 1) / frames * 100}%`;
            }

            const { createFFmpeg, fetchFile } = window.FFmpeg;
            const ffmpeg = createFFmpeg({
                log: true,
                corePath: '/lib/ffmpeg-core.js',
                workerPath: '/lib/ffmpeg-core.worker.js',
                wasmPath: '/lib/ffmpeg-core.wasm'
            });
            await ffmpeg.load();
            for (let i = 0; i < frameData.length; i++) {
                ffmpeg.FS('writeFile', `frame${i}.png`, await fetchFile(frameData[i]));
            }
            await ffmpeg.run('-framerate', '30', '-i', 'frame%d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', 'output.mp4');
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const sanitizedText = (marqueeText.value || 'Подпишись').replace(/[^a-zA-Z0-9а-яА-Я]/g, '_').slice(0, 20);
            saveAs(blob, `marquee_${sanitizedText}_${duration}s.mp4`);
            ffmpeg.FS('unlink', 'output.mp4');
            for (let i = 0; i < frameData.length; i++) {
                ffmpeg.FS('unlink', `frame${i}.png`);
            }
        } catch (error) {
            console.error('Ошибка генерации видео:', error);
            alert('Ошибка при генерации видео. Проверьте консоль и попробуйте снова.');
        } finally {
            saveVideo.disabled = false;
            saveVideo.textContent = 'Скачать видео';
            progressBar.style.display = 'none';
        }
    });

    // Начальная анимация
    animateMarquee();
});
