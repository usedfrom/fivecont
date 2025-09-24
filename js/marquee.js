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

    if (!marqueeModal || !marqueeText || !useAIText || !marqueeSpeed || !fontColor || !fontFamily || !fontSize || !effectType || !backgroundImage || !marqueePreview || !saveVideo || !videoDuration || !closeMarqueeModal) {
        console.error('Ошибка: Не найдены элементы модального окна');
        return;
    }

    const ctx = marqueePreview.getContext('2d');
    let xPos = marqueePreview.width;
    let backgroundImg = null;
    let animationFrame = null;

    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    function resizeImageToCanvas(img, canvasWidth, canvasHeight) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');
        const imgRatio = img.width / img.height;
        const canvasRatio = canvasWidth / canvasHeight;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }

        tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        return tempCanvas;
    }

    backgroundImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                backgroundImg = new Image();
                backgroundImg.src = event.target.result;
                backgroundImg.onload = () => {
                    backgroundImg = resizeImageToCanvas(backgroundImg, 5120, 1080);
                    if (!animationFrame) animateMarquee();
                };
            };
            reader.readAsDataURL(file);
        }
    });

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
                xPos = marqueePreview.width;
                if (!animationFrame) animateMarquee();
            }
        } catch (error) {
            console.error('Ошибка получения текста AI:', error);
            marqueeText.value = 'Ошибка при загрузке текста AI';
        }
    });

    marqueeText.addEventListener('input', () => {
        if (marqueeText.value.length > 50) {
            marqueeText.value = marqueeText.value.slice(0, 50);
        }
        xPos = marqueePreview.width;
        if (!animationFrame) animateMarquee();
    });

    function generateUniqueBackground(ctx, width, height) {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, '#1a0000');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
            const gradient = ctx.createRadialGradient(
                Math.random() * width,
                Math.random() * height,
                0,
                Math.random() * width,
                Math.random() * height,
                50
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, 0.2)`);
            gradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 50, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    function applyEffect(ctx, text, x, y, effect, time) {
        ctx.save();
        ctx.font = `bold ${fontSize.value}px "${fontFamily.value}"`;
        ctx.fillStyle = fontColor.value;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        switch (effect) {
            case 'glow':
                ctx.shadowColor = fontColor.value;
                ctx.shadowBlur = 10;
                break;
            case 'pulse':
                const scale = 1 + Math.sin(time * 0.005) * 0.1;
                ctx.translate(x, y);
                ctx.scale(scale, scale);
                ctx.translate(-x, -y);
                break;
            case 'bounce':
                y += Math.sin(time * 0.01) * 20;
                break;
            case 'fade':
                ctx.globalAlpha = 0.5 + Math.sin(time * 0.005) * 0.5;
                break;
            case 'rotate':
                ctx.translate(x, y);
                ctx.rotate(Math.sin(time * 0.005) * 0.2);
                ctx.translate(-x, -y);
                break;
            case 'wave':
                y += Math.sin(x * 0.01 + time * 0.005) * 20;
                break;
            case 'blink':
                ctx.globalAlpha = Math.abs(Math.sin(time * 0.01));
                break;
            case 'scale':
                ctx.translate(x, y);
                ctx.scale(1 + Math.sin(time * 0.005) * 0.2, 1);
                ctx.translate(-x, -y);
                break;
            case 'skew':
                ctx.transform(1, Math.sin(time * 0.005) * 0.2, 0, 1, 0, 0);
                break;
        }
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    function animateMarquee() {
        ctx.clearRect(0, 0, marqueePreview.width, marqueePreview.height);
        if (backgroundImg) {
            ctx.drawImage(backgroundImg, 0, 0);
        } else {
            generateUniqueBackground(ctx, marqueePreview.width, marqueePreview.height);
        }
        xPos -= parseInt(marqueeSpeed.value);
        if (xPos < -ctx.measureText(marqueeText.value || 'Подпишись!').width) {
            xPos = marqueePreview.width;
        }
        applyEffect(ctx, marqueeText.value || 'Подпишись!', xPos, marqueePreview.height / 2, effectType.value, performance.now());
        animationFrame = requestAnimationFrame(animateMarquee);
    }

    [marqueeSpeed, fontColor, fontFamily, fontSize, effectType].forEach(input => {
        input.addEventListener('input', () => {
            xPos = marqueePreview.width;
            if (!animationFrame) animateMarquee();
        });
    });

    closeMarqueeModal.addEventListener('click', () => {
        marqueeModal.style.display = 'none';
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    });

    saveVideo.addEventListener('click', async () => {
        saveVideo.disabled = true;
        saveVideo.textContent = 'Генерация...';
        try {
            const duration = parseInt(videoDuration.value);
            const fps = 30;
            const frames = duration * fps;
            const frameData = [];

            for (let i = 0; i < frames; i++) {
                ctx.clearRect(0, 0, marqueePreview.width, marqueePreview.height);
                if (backgroundImg) {
                    ctx.drawImage(backgroundImg, 0, 0);
                } else {
                    generateUniqueBackground(ctx, marqueePreview.width, marqueePreview.height);
                }
                const frameX = marqueePreview.width - (i * parseInt(marqueeSpeed.value) % (marqueePreview.width + ctx.measureText(marqueeText.value || 'Подпишись!').width));
                applyEffect(ctx, marqueeText.value || 'Подпишись!', frameX, marqueePreview.height / 2, effectType.value, i * 1000 / fps);
                frameData.push(marqueePreview.toDataURL('image/png'));
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
            saveAs(blob, `marquee_${duration}s.mp4`);
            ffmpeg.FS('unlink', 'output.mp4');
            for (let i = 0; i < frameData.length; i++) {
                ffmpeg.FS('unlink', `frame${i}.png`);
            }
        } catch (error) {
            console.error('Ошибка генерации видео:', error);
            alert('Ошибка при генерации видео. Попробуйте снова.');
        } finally {
            saveVideo.disabled = false;
            saveVideo.textContent = 'Сохранить видео';
        }
    });

    // Начальная анимация
    animateMarquee();
});
