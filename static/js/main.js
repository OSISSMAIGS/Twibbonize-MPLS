document.addEventListener('DOMContentLoaded', () => {
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

    let userImage = new Image();
    let frameImage = new Image();
    frameImage.crossOrigin = 'Anonymous'; // Handle potential CORS issues with canvas
    let isFrameProcessed = false;

    let scale = 1;
    let rotation = 0; // In degrees
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    function resetImageState() {
        scale = 1;
        rotation = 0;
        zoomSlider.value = 1;
        if (userImage.src) {
            // Recenter the image
            offsetX = (canvas.width - userImage.width) / 2;
            offsetY = (canvas.height - userImage.height) / 2;
            drawCanvas();
        }
    }

    function changeFrame(frameUrl) {
        if (!frameUrl) {
            console.warn('No initial frame found. Drawing placeholder.');
            drawPlaceholderFrame();
            return;
        }
        showLoader();
        isFrameProcessed = false; // Reset for new frames (especially JPEGs)
        frameImage.src = frameUrl;
    }

    frameImage.onload = () => {
        // If the frame is a JPEG, we need to manually make the white areas transparent.
        const isJpeg = canvas.dataset.frameUrl.toLowerCase().includes('.jpeg') || canvas.dataset.frameUrl.toLowerCase().includes('.jpg');
        
        if (isJpeg && !isFrameProcessed) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = canvas.width;
            frameCanvas.height = canvas.height;
            const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
            frameCtx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

            try {
                const imageData = frameCtx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                // A tolerance is needed because JPEG compression isn't perfect.
                const tolerance = 20; 

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                    }
                }
                frameCtx.putImageData(imageData, 0, 0);

                isFrameProcessed = true; // Flag to prevent an infinite loop
                frameImage.src = frameCanvas.toDataURL(); // This re-triggers onload
                return; // Exit and wait for the new Data URL to load
            } catch (error) {
                console.error("Could not process JPEG frame due to browser security restrictions. Displaying as-is.", error);
            }
        }
        
        drawCanvas(); // Draw initial state (frame or placeholder text)
        hideLoader(); // Hide loader once frame is ready and drawn
    };

    frameImage.onerror = () => {
        console.warn('Frame not found. Drawing a placeholder frame.');
        drawPlaceholderFrame();
        hideLoader(); // Also hide loader on error
    };

    function drawPlaceholderFrame() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.strokeStyle = 'var(--secondary-color, #3b82f6)';
        tempCtx.lineWidth = 25;
        tempCtx.strokeRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Text removed from placeholder frame for a cleaner look

        // Replace the frameImage with the placeholder
        frameImage.src = tempCanvas.toDataURL();
    }

    function drawCanvas() {
        // Always start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the transformed user image first (background)
        if (userImage.src) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            // Translate to the center of the image to rotate around it
            ctx.translate(userImage.width / 2, userImage.height / 2);
            ctx.rotate(rotation * Math.PI / 180);
            // Translate back before drawing
            ctx.translate(-userImage.width / 2, -userImage.height / 2);
            ctx.drawImage(userImage, 0, 0);
            ctx.restore();
        }

        // Draw the frame on top
        if (frameImage.complete && frameImage.naturalHeight !== 0) {
            ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        }
    }

    function showLoader() {
        loader.classList.remove('loader-hidden');
        loader.classList.add('loader-visible');
    }

    function hideLoader() {
        loader.classList.remove('loader-visible');
        loader.classList.add('loader-hidden');
    }

    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showLoader();
            const reader = new FileReader();
            reader.onload = (event) => {
                userImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    userImage.onload = () => {
        // Reset transformations for new image
        resetImageState();
        
        // Show controls
        zoomControls.style.display = 'block';
        actionButtons.style.display = 'grid';
        
        hideLoader();
    };

    // Zoom functionality
    zoomSlider.addEventListener('input', (e) => {
        const oldScale = scale;
        scale = parseFloat(e.target.value);

        // Adjust offset to zoom towards the center of the canvas
        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;

        offsetX = canvasCenterX - (canvasCenterX - offsetX) * (scale / oldScale);
        offsetY = canvasCenterY - (canvasCenterY - offsetY) * (scale / oldScale);

        drawCanvas();
    });

    // Panning functionality
    canvas.addEventListener('mousedown', (e) => {
        if (userImage.src) {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            offsetX += dx;
            offsetY += dy;
            lastX = e.clientX;
            lastY = e.clientY;
            drawCanvas();
        }
    });

    // Touch events for mobile panning
    canvas.addEventListener('touchstart', (e) => {
        if (userImage.src && e.touches.length === 1) {
            e.preventDefault(); // Prevent page from scrolling
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault(); // Prevent page from scrolling
            const dx = e.touches[0].clientX - lastX;
            const dy = e.touches[0].clientY - lastY;
            offsetX += dx;
            offsetY += dy;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
            drawCanvas();
        }
    }, { passive: false });
    
    // Download functionality
    downloadBtn.addEventListener('click', () => {
        if (!userImage.src) {
            alert("Please upload an image first!");
            return;
        }
        // Redraw canvas one last time to ensure everything is perfect
        drawCanvas();

        // Trigger confetti
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#e2e8f0', '#93c5fd', '#3b82f6', '#1e3a8a']
        });
        
        // Trigger download
        const link = document.createElement('a');
        link.download = 'twibbon_luminance.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Show caption section
        captionSection.style.display = 'block';
        captionSection.scrollIntoView({ behavior: 'smooth' });
    });

    rotateBtn.addEventListener('click', () => {
        if (userImage.src) {
            rotation = (rotation + 90) % 360;
            drawCanvas();
        }
    });

    resetBtn.addEventListener('click', () => {
        if (userImage.src) {
            resetImageState();
        }
    });

    // Copy caption functionality
    copyCaptionBtn.addEventListener('click', () => {
        // Use the new Clipboard API for modern browsers
        navigator.clipboard.writeText(captionTemplate.innerText).then(() => {
            // Give user feedback
            const originalText = copyCaptionBtn.innerText;
            copyCaptionBtn.innerText = 'Copied!';
            setTimeout(() => {
                copyCaptionBtn.innerText = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy caption. Please copy it manually.');
        });
    });

    // Initial state
    // Kick off the loading process for the default frame.
    frameImage.src = canvas.dataset.frameUrl;
}); 