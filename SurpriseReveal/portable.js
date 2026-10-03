import {choices,styling,mechanism} from './personalization.js';
export const maxLinkLength=32000;
const limits={recipient:80,sender:80,signoff:120,cover:120,headline:180,body:2000,note:500,number:8};
const encoder=new TextEncoder(),decoder=new TextDecoder();
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function bytes(text){if(typeof text!=='string'||!/^[A-Za-z0-9_-]+$/.test(text))throw Error('This reveal link is incomplete.');return Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
async function transform(input,kind){const stream=new Blob([input]).stream().pipeThrough(kind);const reader=stream.getReader();let total=0,parts=[];while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>150000){await reader.cancel();throw Error('This reveal is too large.');}parts.push(value);}const result=new Uint8Array(total);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length;}return result;}
export function validContent(input,catalogue){
 if(!input||typeof input!=='object')throw Error('Choose a valid reveal.');const t=catalogue.find(t=>t.id===input.templateId);if(!t)throw Error('Choose an available design.');
 const c={templateId:t.id,palette:input.palette==='alternate'?'alternate':'original',...styling(input),showCredit:false};
 for(const [key,max] of Object.entries(limits)){const value=input[key]??'';if(typeof value!=='string'||[...value].length>max)throw Error(key+': maximum '+max+' characters.');c[key]=value.trim();}
 for(const key of ['cover','headline','body'])if(!c[key])throw Error(key+' is required.');
 for(const [key,list] of Object.entries(choices))if(input[key]!=null&&!list.some(([id])=>id===input[key]))throw Error('Choose an available '+key+'.');
 c.clues=[];if(t.supports_clues){if(!Array.isArray(input.clues)||input.clues.length<1||input.clues.length>3||input.clues.some(x=>typeof x!=='string'||!x.trim()||[...x].length>180))throw Error('Add one to three short clues.');c.clues=input.clues.map(x=>x.trim());}
 for(const [key,supported] of [['background',true],['photo',t.supports_photo],['logo',t.supports_logo]])if(input[key]&&supported){if(typeof input[key]!=='string'||input[key].length>14000||!/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(input[key]))throw Error('Choose a smaller JPEG, PNG or WebP image.');c[key]=input[key];}
 return c;
}
export function publicCover(c,catalogue){const t=catalogue.find(t=>t.id===c.templateId);return{templateId:t.id,name:t.name,mechanism:mechanism(t,c),cover:c.cover,palette:c.palette,...styling(c),...(c.background?{background:c.background}:{})};}
export async function sealGift(input,catalogue){
 const c=validContent(input,catalogue),key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
 const raw=encoder.encode(JSON.stringify(c));const packed=typeof CompressionStream==='function'?await transform(raw,new CompressionStream('gzip')):raw;
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,packed);
 const envelope={v:1,cover:publicCover(c,catalogue),key:base64(new Uint8Array(await crypto.subtle.exportKey('raw',key))),iv:base64(iv),data:base64(new Uint8Array(data)),gzip:packed!==raw};
 const token=base64(encoder.encode(JSON.stringify(envelope)));if(token.length+200>maxLinkLength)throw Error('These images make the link too long. Remove an image or choose smaller artwork.');return{token,content:c};
}
export function readEnvelope(token,catalogue){
 if(typeof token!=='string'||token.length>maxLinkLength)throw Error('This reveal link is too large.');const envelope=JSON.parse(decoder.decode(bytes(token)));if(envelope.v!==1||!envelope.cover||typeof envelope.key!=='string'||typeof envelope.iv!=='string'||typeof envelope.data!=='string'||typeof envelope.gzip!=='boolean')throw Error('This reveal link is incomplete.');
 const t=catalogue.find(t=>t.id===envelope.cover.templateId);if(!t)throw Error('This design is unavailable.');const c=envelope.cover;
 if(typeof c.cover!=='string'||[...c.cover].length>120||!c.cover.trim())throw Error('This cover is incomplete.');
 for(const [k,list] of Object.entries(choices))if(!list.some(([id])=>id===c[k]))throw Error('This cover is invalid.');
 if(c.background&&(typeof c.background!=='string'||c.background.length>14000||!/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(c.background)))throw Error('This background is invalid.');
 // Only bounded cover properties reach the renderer, even for a hand-edited link.
 envelope.cover=publicCover(c,catalogue);return envelope;
}
export async function openGift(envelope,catalogue){try{
 const key=await crypto.subtle.importKey('raw',bytes(envelope.key),'AES-GCM',false,['decrypt']);const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv)},key,bytes(envelope.data));
 const data=envelope.gzip?await transform(raw,new DecompressionStream('gzip')):new Uint8Array(raw);return validContent(JSON.parse(decoder.decode(data)),catalogue);
 }catch{throw Error('This reveal link is damaged or incomplete. Ask the sender for the complete link.');}}
export async function compactImage(file){
 if(file.size>5*1024*1024)throw Error('Maximum upload is 5 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG or WebP image.');
 const image=await createImageBitmap(file);try{if(image.width*image.height>16000000)throw Error('Maximum image size is 16 million pixels.');let edge=660;
 while(edge>=160){const scale=Math.min(1,edge/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);for(const quality of [.7,.5,.3]){const data=canvas.toDataURL('image/webp',quality);if(data.startsWith('data:image/webp;')&&data.length<=12000)return data;}edge=Math.floor(edge*.72);}
 throw Error('Choose simpler or smaller artwork for a shareable link.');}finally{image.close();}
}
