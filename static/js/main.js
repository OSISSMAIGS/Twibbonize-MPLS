// main.js: handle image, canvas, caption copy, dll.
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
    frameImage.crossOrigin = 'Anonymous';
    let isFrameProcessed = false;

    let scale = 1;
    let rotation = 0;
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
            offsetX = (canvas.width - userImage.width) / 2;
            offsetY = (canvas.height - userImage.height) / 2;
            drawCanvas();
        }
    }

    function drawPlaceholderFrame() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.strokeStyle = 'var(--secondary-color, #3b82f6)';
        tempCtx.lineWidth = 25;
        tempCtx.strokeRect(0, 0, tempCanvas.width, tempCanvas.height);
        frameImage.src = tempCanvas.toDataURL();
    }

    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        if (frameImage.complete && frameImage.naturalHeight!==0) {
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

    imageLoader.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            showLoader();
            const r = new FileReader();
            r.onload = ev => userImage.src=ev.target.result;
            r.readAsDataURL(file);
        }
    });

    userImage.onload = () => { resetImageState(); zoomControls.style.display='block'; actionButtons.style.display='grid'; hideLoader(); };

    zoomSlider.addEventListener('input', e => {
        const old=scale; scale=parseFloat(e.target.value);
        const cx=canvas.width/2, cy=canvas.height/2;
        offsetX = cx - (cx-offsetX)*(scale/old);
        offsetY = cy - (cy-offsetY)*(scale/old);
        drawCanvas();
    });

    ['mousedown','mouseup','mouseleave','mousemove'].forEach(evt => canvas.addEventListener(evt, e=>{
        if(evt==='mousedown' && userImage.src){isDragging=true; lastX=e.clientX; lastY=e.clientY; canvas.style.cursor='grabbing';}
        if(evt==='mouseup'||evt==='mouseleave'){isDragging=false; canvas.style.cursor='grab';}
        if(evt==='mousemove' && isDragging){ const dx=e.clientX-lastX, dy=e.clientY-lastY; offsetX+=dx; offsetY+=dy; lastX=e.clientX; lastY=e.clientY; drawCanvas(); }
    }));

    ['touchstart','touchend','touchmove'].forEach((evt,i)=> canvas.addEventListener(evt,e=>{
        if(evt==='touchstart'&& userImage.src&&e.touches.length===1){e.preventDefault(); isDragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY;}
        if(evt==='touchend'){isDragging=false;}
        if(evt==='touchmove'&& isDragging&&e.touches.length===1){e.preventDefault(); const dx=e.touches[0].clientX-lastX, dy=e.touches[0].clientY-lastY; offsetX+=dx; offsetY+=dy; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; drawCanvas();}
    },{passive:false}));

    downloadBtn.addEventListener('click',()=>{
        if(!userImage.src){ alert('Please upload an image first!'); return; }
        drawCanvas(); confetti({particleCount:150,spread:90,origin:{y:0.6},colors:['#e2e8f0','#93c5fd','#3b82f6','#1e3a8a']});
        const a=document.createElement('a'); a.download='twibbon_luminance.png'; a.href=canvas.toDataURL('image/png'); a.click();
        captionSection.style.display='block'; captionSection.scrollIntoView({behavior:'smooth'});
    });

    rotateBtn.addEventListener('click',()=>{ if(userImage.src){ rotation=(rotation+90)%360; drawCanvas(); }});
    resetBtn.addEventListener('click',()=>{ if(userImage.src) resetImageState(); });

    copyCaptionBtn.addEventListener('click',()=>{
        let html=captionTemplate.innerHTML;
        html=html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi,'\n\n');
        html=html.replace(/<br\s*\/?>/gi,' ');
        html=html.replace(/<\/?[^>]+>/g,'');
        html=html.replace(/&nbsp;/g,' ');
        const paras=html.split(/\n{2,}/).map(p=>p.trim()).filter(p=>p);
        const text=paras.join('\n\n');
        navigator.clipboard.writeText(text).then(()=>{
            const o=copyCaptionBtn.innerText; copyCaptionBtn.innerText='Copied!'; setTimeout(()=>copyCaptionBtn.innerText=o,2000);
        }).catch(err=>{ console.error('Could not copy:',err); alert('Gagal menyalin caption.'); });
    });

    frameImage.onload = () => {
        const isJpeg = canvas.dataset.frameUrl.toLowerCase().includes('.jpeg') || canvas.dataset.frameUrl.toLowerCase().includes('.jpg');
        if(isJpeg && !isFrameProcessed){
            const fc=document.createElement('canvas'); fc.width=canvas.width; fc.height=canvas.height;
            const fctx=fc.getContext('2d',{willReadFrequently:true}); fctx.drawImage(frameImage,0,0,canvas.width,canvas.height);
            try{
                const imgd=fctx.getImageData(0,0,canvas.width,canvas.height), d=imgd.data;
                for(let i=0;i<d.length;i+=4){ if(d[i]>235&&d[i+1]>235&&d[i+2]>235) d[i+3]=0; }
                fctx.putImageData(imgd,0,0); isFrameProcessed=true; frameImage.src=fc.toDataURL(); return;
            }catch(e){ console.error('JPEG proc blocked, fallback',e); }
        }
        drawCanvas(); hideLoader();
    };
    frameImage.onerror = () => { drawPlaceholderFrame(); hideLoader(); };
    frameImage.src = canvas.dataset.frameUrl;
});