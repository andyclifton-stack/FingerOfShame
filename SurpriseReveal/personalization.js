// Shared, bounded choices: no arbitrary CSS or executable theme content.
export const choices={
 font:[['design','Design original'],['editorial','Editorial · elegant serif'],['modern','Modern · clean rounded'],['playful','Playful · handwritten'],['typewriter','Typewriter · a personal note']],
 backdrop:[['design','Design original'],['aurora','Aurora · lilac & mint'],['sunset','Sunset · peach & coral'],['midnight','Midnight · stars & indigo']],
 revealStyle:[['slider','Slide to reveal'],['button','A simple button'],['scratch','Scratch card'],['envelope','Open an envelope'],['curtains','Draw the curtains'],['design','Design original']],
 celebration:[['none','Just the reveal'],['confetti','Confetti shower'],['stars','A little stardust'],['hearts','Floating hearts']],
 foil:[['gold','Champagne gold'],['silver','Holographic silver'],['rose','Rose gold']],
 scratchTool:[['coin','Lucky coin'],['finger','Fingertip']],
 scratchSound:[['off','No sound'],['optional','Offer scratch sounds']]
};
export const defaults={font:'design',backdrop:'design',revealStyle:'design',celebration:'none',foil:'gold',scratchTool:'coin',scratchSound:'off'};
export function styling(c={}){return Object.fromEntries(Object.entries(choices).map(([k,list])=>[k,list.some(([id])=>id===c[k])?c[k]:defaults[k]]));}
export function mechanism(t,c){const style=styling(c).revealStyle;return style==='design'?t.mechanism:style;}
