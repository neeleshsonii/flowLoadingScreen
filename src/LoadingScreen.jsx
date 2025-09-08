import React, { useRef, useState, useEffect } from 'react';

const LoadingScreen = () => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const imageData = await window.fs.readFile('paste.txt', { encoding: 'utf8' });
        const img = new Image();
        img.onload = () => setUploadedImage(img);
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(25, 30, 15, 15);
        ctx.fillRect(60, 30, 15, 15);
        ctx.fillRect(35, 60, 30, 10);

        img.src = canvas.toDataURL();
      } catch (error) {
        console.log('No image uploaded, using default');
      }
    };

    loadImage();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const borderWidth = 4;
      const cornerRadius = 20;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth, cornerRadius);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(borderWidth, borderWidth, canvas.width - borderWidth * 2, canvas.height - borderWidth * 2, cornerRadius - borderWidth);
      ctx.clip();

      const containerHeight = canvas.height - borderWidth * 2;
      const containerY = borderWidth;
      const waterLevel = (loading / 100) * containerHeight;
      const waterY = containerY + containerHeight - waterLevel;

      if (waterLevel > 0) {
        const time = Date.now() * 0.003;
        const waveHeight = loading < 100 ? 8 : 0;
        const waveFreq = 0.008;

        ctx.fillStyle = '#1a1a1a';

        if (loading < 100) {
          ctx.beginPath();
          ctx.moveTo(borderWidth, waterY);
          for (let x = borderWidth; x <= canvas.width - borderWidth; x += 2) {
            const wave1 = Math.sin((x - borderWidth) * waveFreq + time) * waveHeight;
            const wave2 = Math.sin((x - borderWidth) * waveFreq * 1.5 + time * 1.3) * (waveHeight * 0.5);
            const y = waterY + wave1 + wave2;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.lineTo(borderWidth, canvas.height - borderWidth);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(borderWidth, containerY, canvas.width - borderWidth * 2, containerHeight);
        }

        if (loading < 100) {
          const gradient = ctx.createLinearGradient(borderWidth, waterY, borderWidth + (canvas.width - borderWidth * 2) / 3, waterY);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(borderWidth, waterY);
          for (let x = borderWidth; x <= borderWidth + (canvas.width - borderWidth * 2) / 3; x += 2) {
            const wave = Math.sin((x - borderWidth) * waveFreq + time) * waveHeight;
            ctx.lineTo(x, waterY + wave);
          }
          ctx.lineTo(borderWidth + (canvas.width - borderWidth * 2) / 3, canvas.height - borderWidth);
          ctx.lineTo(borderWidth, canvas.height - borderWidth);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          const bubbleArea = canvas.width - borderWidth * 2 - 80;
          for (let i = 0; i < 15; i++) {
            const bubbleX = borderWidth + 40 + (i * bubbleArea / 14) + Math.sin(time + i) * 20;
            const bubbleY = waterY + 40 + Math.sin(time * 1.5 + i * 2) * 30;
            const bubbleSize = 3 + Math.sin(time * 2 + i) * 2;

            if (bubbleY < canvas.height - borderWidth - 10) {
              ctx.beginPath();
              ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();

      if (loading === 100 && imageOpacity > 0 && uploadedImage) {
        const containerX = borderWidth;
        const containerY = borderWidth;
        const containerWidth = canvas.width - borderWidth * 2;
        const containerHeight = canvas.height - borderWidth * 2;
        const containerCenterX = containerX + containerWidth / 2;
        const containerCenterY = containerY + containerHeight / 2;
        const maxSize = Math.min(containerWidth, containerHeight) * 0.6;
        const aspectRatio = uploadedImage.width / uploadedImage.height;
        let imageWidth, imageHeight;

        if (aspectRatio > 1) {
          imageWidth = Math.min(maxSize, containerWidth * 0.6);
          imageHeight = imageWidth / aspectRatio;
        } else {
          imageHeight = Math.min(maxSize, containerHeight * 0.6);
          imageWidth = imageHeight * aspectRatio;
        }

        const imageX = containerCenterX - imageWidth / 2;
        const imageY = containerCenterY - imageHeight / 2;

        ctx.save();
        ctx.globalAlpha = imageOpacity;
        ctx.beginPath();
        ctx.roundRect(containerX, containerY, containerWidth, containerHeight, cornerRadius - borderWidth);
        ctx.clip();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageWidth;
        tempCanvas.height = imageHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(uploadedImage, 0, 0, imageWidth, imageHeight);

        const imageData = tempCtx.getImageData(0, 0, imageWidth, imageHeight);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, imageX, imageY);
        ctx.restore();
      }
    }
  }, [loading, imageOpacity, uploadedImage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [loading === 0]);

  useEffect(() => {
    if (loading === 100) {
      const startTime = Date.now();
      const duration = 2000;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setImageOpacity(easeOut);
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    } else {
      setImageOpacity(0);
    }
  }, [loading]);

  useEffect(() => {
    let animationId;
    const animate = () => {
      if (canvasRef.current) {
        setLoading(prev => prev);
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-percentage">
        {Math.round(loading)}%
      </div>

      <div className="loading-canvas-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="loading-canvas"
        />

        <p className="loading-text">
          {loading < 100 ? 'Loading...' : 'Complete!'}
        </p>

        {loading === 100 && (
          <button
            className="loading-restart-button"
            onClick={() => setLoading(0)}
          >
            Restart Loading
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
