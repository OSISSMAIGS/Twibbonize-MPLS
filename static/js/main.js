document.addEventListener('DOMContentLoaded', () => {
    // --- Element references ---
    const container = document.querySelector('.container');
    const loader = document.getElementById('loader');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageLoader = document.getElementById('imageLoader');
    const zoomSlider = document.getElementById('zoom');
    const downloadBtn = document.getElementById('downloadBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const actionButtons = document.querySelector('.action-buttons');
    const copyCaptionBtn = document.getElementById('copyCaptionBtn');
    const zoomControls = document.getElementById('zoom-controls');
    const captionSection = document.getElementById('caption-section');
    const captionTemplate = document.getElementById('caption-template');
  
    // --- State ---
    let userImage = new Image();
    let frameImage = new Image();
    frameImage.crossOrigin = 'Anonymous';  // but ensure server sets CORS header
    let isFrameProcessed = false;
  
    let scale = 1, rotation = 0, offsetX = 0, offsetY = 0;
    let isDragging = false, lastX = 0, lastY = 0;
  
    // --- Utility Functions ---
    function showLoader() {
      loader.classList.remove('loader-hidden');
      loader.classList.add('loader-visible');
    }
    function hideLoader() {
      loader.classList.remove('loader-visible');
      loader.classList.add('loader-hidden');
    }
    function resetImageState() {
      scale = 1; rotation = 0; zoomSlider.value = 1;
      if (userImage.src) {
        offsetX = (canvas.width - userImage.width) / 2;
        offsetY = (canvas.height - userImage.height) / 2;
        drawCanvas();
      }
    }
    function drawPlaceholderFrame() {
      const temp = document.createElement('canvas');
      temp.width = canvas.width; temp.height = canvas.height;
      const tctx = temp.getContext('2d');
      tctx.strokeStyle = 'var(--secondary-color,#3b82f6)';
      tctx.lineWidth = 25;
      tctx.strokeRect(0,0,temp.width,temp.height);
      frameImage.src = temp.toDataURL();
    }
    function drawCanvas() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (userImage.src) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(userImage.width/2, userImage.height/2);
        ctx.rotate(rotation * Math.PI/180);
        ctx.translate(-userImage.width/2, -userImage.height/2);
        ctx.drawImage(userImage, 0, 0);
        ctx.restore();
      }
      if (frameImage.complete && frameImage.naturalHeight !== 0) {
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
      }
    }
  
    // --- Unhide main container langsung ---
    container.classList.remove('hidden');
  
    // --- Image loading ---
    imageLoader.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      showLoader();
      const reader = new FileReader();
      reader.onload = ev => userImage.src = ev.target.result;
      reader.readAsDataURL(file);
    });
    userImage.onload = () => {
      resetImageState();
      zoomControls.style.display = 'block';
      actionButtons.style.display = 'grid';
      hideLoader();
    };
  
    // --- Zoom & Drag ---
    zoomSlider.addEventListener('input', e => {
      const oldScale = scale;
      scale = parseFloat(e.target.value);
      // center zoom
      const cx = canvas.width/2, cy = canvas.height/2;
      offsetX = cx - (cx - offsetX) * (scale/oldScale);
      offsetY = cy - (cy - offsetY) * (scale/oldScale);
      drawCanvas();
    });
    ['mousedown','mouseup','mouseleave','mousemove'].forEach(evt => {
      canvas.addEventListener(evt, e => {
        if (evt === 'mousedown' && userImage.src) {
          isDragging = true;
          lastX = e.clientX; lastY = e.clientY;
          canvas.style.cursor = 'grabbing';
        }
        if (evt === 'mouseup' || evt === 'mouseleave') {
          isDragging = false;
          canvas.style.cursor = 'grab';
        }
        if (evt === 'mousemove' && isDragging) {
          const dx = e.clientX - lastX, dy = e.clientY - lastY;
          offsetX += dx; offsetY += dy;
          lastX = e.clientX; lastY = e.clientY;
          drawCanvas();
        }
      });
    });
    ['touchstart','touchend','touchmove'].forEach(evt => {
      canvas.addEventListener(evt, e => {
        if (evt === 'touchstart' && userImage.src && e.touches.length === 1) {
          e.preventDefault();
          isDragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        }
        if (evt === 'touchend') {
          isDragging = false;
        }
        if (evt === 'touchmove' && isDragging && e.touches.length === 1) {
          e.preventDefault();
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          offsetX += dx; offsetY += dy;
          lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
          drawCanvas();
        }
      }, { passive: false });
    });
  
    // --- Download handler with try/catch & Blob fallback ---
    downloadBtn.addEventListener('click', async () => {
      if (!userImage.src) {
        alert('Please upload an image first!');
        return;
      }
      drawCanvas();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 },
        colors: ['#e2e8f0','#93c5fd','#3b82f6','#1e3a8a'] });
      let dataURL;
      try {
        dataURL = canvas.toDataURL('image/png');
      } catch (err) {
        alert('Canvas toDataURL failed: ' + err);
      }
  
      // Convert to Blob
      const blob = await (async () => {
        if (dataURL) {
          const res = await fetch(dataURL);
          return await res.blob();
        } else {
          // fallback: redraw on offscreen canvas WITHOUT frame
          const off = document.createElement('canvas');
          off.width = canvas.width; off.height = canvas.height;
          const octx = off.getContext('2d');
          octx.drawImage(userImage, offsetX, offsetY, userImage.width*scale, userImage.height*scale);
          return await new Promise(resolve => off.toBlob(resolve, 'image/png'));
        }
      })();
  
      // Browser‐specific download
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, 'twibbon_luminance.png');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'twibbon_luminance.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
  
      captionSection.style.display = 'block';
      captionSection.scrollIntoView({ behavior: 'smooth' });
    });
  
    // --- Rotate & Reset ---
    rotateBtn.addEventListener('click', () => {
      if (!userImage.src) return;
      rotation = (rotation + 90) % 360;
      drawCanvas();
    });
    resetBtn.addEventListener('click', () => {
      if (!userImage.src) return;
      resetImageState();
    });
  
    // --- Copy caption (unchanged) ---
    copyCaptionBtn.addEventListener('click', () => {
      let html = captionTemplate.innerHTML
        .replace(/<br\s*\/?>(?:<br\s*\/?>)*/gi, '\n\n')
        .replace(/<br\s*\/?/gi, ' ')
        .replace(/<\/?[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ');
      const paras = html.split(/\n{2,}/).map(p => p.trim()).filter(p => p);
      const text = paras.join('\n\n');
      navigator.clipboard.writeText(text)
        .then(() => {
          const orig = copyCaptionBtn.innerText;
          copyCaptionBtn.innerText = 'Copied!';
          setTimeout(() => copyCaptionBtn.innerText = orig, 2000);
        })
        .catch(err => {
          alert('Gagal menyalin caption: ' + err);
        });
    });
  
    // --- Frame image loading & JPEG processing fallback ---
    frameImage.onload = () => {
      const isJpeg = /\.jpe?g$/i.test(canvas.dataset.frameUrl);
      if (isJpeg && !isFrameProcessed) {
        const fc = document.createElement('canvas');
        fc.width = canvas.width; fc.height = canvas.height;
        const fctx = fc.getContext('2d', { willReadFrequently: true });
        fctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        try {
          const imgd = fctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgd.data;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i] > 235 && d[i+1] > 235 && d[i+2] > 235) d[i+3] = 0;
          }
          fctx.putImageData(imgd, 0, 0);
          isFrameProcessed = true;
          frameImage.src = fc.toDataURL();
          return;
        } catch (e) {
          alert('JPEG processing blocked, fallback: ' + e);
        }
      }
      drawCanvas();
      hideLoader();
    };
    frameImage.onerror = () => {
      drawPlaceholderFrame();
      hideLoader();
    };
    frameImage.src = canvas.dataset.frameUrl;
  });
  