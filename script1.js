let src = null;
let preset = 'classic';

const presets = {
  classic: {rR:1.04,rG:0.97,rB:0.82,fadeR:225,fadeG:215,fadeB:175,sat:0.92},
  dreamy:  {rR:1.05,rG:0.96,rB:1.06,fadeR:230,fadeG:210,fadeB:230,sat:0.85},
  faded:   {rR:0.97,rG:1.0, rB:1.06,fadeR:210,fadeG:215,fadeB:230,sat:0.78},
  golden:  {rR:1.08,rG:1.0, rB:0.75,fadeR:240,fadeG:220,fadeB:155,sat:0.88},
  matte:   {rR:0.98,rG:1.0, rB:0.97,fadeR:200,fadeG:210,fadeB:205,sat:0.72},
};

const fi=document.getElementById('fi');
const dz=document.getElementById('dz');
const dzIcon=document.getElementById('dz-icon');
const dzTitle=document.getElementById('dz-title');
const dzSub=document.getElementById('dz-sub');
const prevImg=document.getElementById('preview-img');
const gen=document.getElementById('gen');
const outSec=document.getElementById('out-section');
const outC=document.getElementById('out-canvas');
const wc=document.getElementById('wc');

function loadFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  const r=new FileReader();
  r.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      src=img;
      prevImg.src=e.target.result;
      prevImg.style.display='block';
      dzIcon.style.display='none';
      dzTitle.style.display='none';
      dzSub.style.display='none';
      gen.disabled=false;
    };
    img.src=e.target.result;
  };
  r.readAsDataURL(file);
}

fi.addEventListener('change',e=>loadFile(e.target.files[0]));
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over');});
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');loadFile(e.dataTransfer.files[0]);});

document.getElementById('preset-row').addEventListener('click',e=>{
  const b=e.target.closest('.tint-btn');
  if(!b)return;
  document.querySelectorAll('.tint-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  preset=b.dataset.preset;
});

const slFade=document.getElementById('sl-fade');
const slVig=document.getElementById('sl-vig');
const slGrain=document.getElementById('sl-grain');
const slTilt=document.getElementById('sl-tilt');

slFade.addEventListener('input',()=>document.getElementById('vf-val').textContent=slFade.value+'%');
slVig.addEventListener('input',()=>document.getElementById('vv-val').textContent=slVig.value+'%');
slGrain.addEventListener('input',()=>document.getElementById('vg-val').textContent=slGrain.value+'%');
slTilt.addEventListener('input',()=>document.getElementById('vt-val').textContent=slTilt.value+'°');

gen.addEventListener('click',develop);

function develop(){
  if(!src)return;

  const p=presets[preset];
  const fade=parseInt(slFade.value)/100;
  const vigS=parseInt(slVig.value)/100;
  const grainS=parseInt(slGrain.value)/100;
  const tiltDeg=parseFloat(slTilt.value);
  const caption=document.getElementById('cap').value.trim();

  const ps=400;
  const bSide=28;
  const bTop=28;
  const bBot=caption?96:76;
  const pw=ps+bSide*2;
  const ph=ps+bTop+bBot;

  wc.width=ps;wc.height=ps;
  const wx=wc.getContext('2d');

  const sc=Math.max(ps/src.width,ps/src.height);
  const dw=src.width*sc,dh=src.height*sc;
  wx.drawImage(src,(ps-dw)/2,(ps-dh)/2,dw,dh);

  let id=wx.getImageData(0,0,ps,ps),d=id.data;

  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    r=r*p.rR;g=g*p.rG;b=b*p.rB;
    const grey=0.299*r+0.587*g+0.114*b;
    r=r*(1-p.sat*0.2)+grey*p.sat*0.2;
    g=g*(1-p.sat*0.2)+grey*p.sat*0.2;
    b=b*(1-p.sat*0.2)+grey*p.sat*0.2;
    r=r*(1-fade*0.28)+p.fadeR*fade*0.28;
    g=g*(1-fade*0.24)+p.fadeG*fade*0.24;
    b=b*(1-fade*0.30)+p.fadeB*fade*0.30;
    d[i]=Math.min(255,Math.max(0,r));
    d[i+1]=Math.min(255,Math.max(0,g));
    d[i+2]=Math.min(255,Math.max(0,b));
  }
  wx.putImageData(id,0,0);

  if(grainS>0){
    id=wx.getImageData(0,0,ps,ps);d=id.data;
    const ga=grainS*36;
    for(let i=0;i<d.length;i+=4){
      const n=(Math.random()-.5)*ga;
      d[i]=Math.min(255,Math.max(0,d[i]+n));
      d[i+1]=Math.min(255,Math.max(0,d[i+1]+n));
      d[i+2]=Math.min(255,Math.max(0,d[i+2]+n));
    }
    wx.putImageData(id,0,0);
  }

  if(vigS>0){
    const vg=wx.createRadialGradient(ps/2,ps/2,ps*(0.3-vigS*0.1),ps/2,ps/2,ps*0.72);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,`rgba(0,0,0,${vigS*0.65})`);
    wx.fillStyle=vg;
    wx.fillRect(0,0,ps,ps);
  }

  const photoUrl=wc.toDataURL();
  const pad=90;
  const tw=pw+pad*2,th=ph+pad*2;

  outC.width=tw;outC.height=th;
  const ctx=outC.getContext('2d');
  ctx.clearRect(0,0,tw,th);

  const rad=tiltDeg*Math.PI/180;
  ctx.save();
  ctx.translate(tw/2,th/2);
  ctx.rotate(rad);
  ctx.translate(-pw/2,-ph/2);

  ctx.shadowColor='rgba(80,40,20,0.22)';
  ctx.shadowBlur=28;
  ctx.shadowOffsetX=3;
  ctx.shadowOffsetY=10;

  const bg=ctx.createLinearGradient(0,0,pw,ph);
  bg.addColorStop(0,'#fefcf8');
  bg.addColorStop(1,'#faf6ef');
  ctx.fillStyle=bg;
  ctx.beginPath();
  ctx.roundRect(0,0,pw,ph,3);
  ctx.fill();
  ctx.shadowColor='transparent';

  const photoImg=new Image();
  photoImg.onload=()=>{
    ctx.drawImage(photoImg,bSide,bTop,ps,ps);

    ctx.fillStyle='rgba(252,248,240,0.04)';
    ctx.fillRect(bSide,bTop,ps,ps);

    if(caption){
      ctx.save();
      ctx.font="700 27px 'Caveat',cursive";
      ctx.fillStyle='#4a2e1e';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(caption,pw/2,bTop+ps+bBot/2+2);
      ctx.restore();
    }

    ctx.restore();

    outSec.style.display='block';
    setTimeout(()=>outSec.scrollIntoView({behavior:'smooth',block:'start'}),50);
  };
  photoImg.src=photoUrl;
}

document.getElementById('dl').addEventListener('click',()=>{
  const a=document.createElement('a');
  a.download='polaroid.png';
  a.href=outC.toDataURL('image/png');
  a.click();
});