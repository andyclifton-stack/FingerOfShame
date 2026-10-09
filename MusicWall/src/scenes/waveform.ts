import { common } from "./common";
export default common +
  `
uniform float waveform[128];
void main(){
 vec2 p=vUv;float at=clamp((p.x-.06)/.88,0.,.9999)*127.;int i=int(floor(at));
 float trace=mix(waveform[i],waveform[i+1],fract(at));
 float envelope=smoothstep(0.,.055,p.x)*smoothstep(1.,.945,p.x);
 float y=.52+trace*.30*envelope;
 float d=abs(p.y-y),px=1.5/resolution.y;
 vec3 tint=mix(primary,secondary,smoothstep(.1,.9,p.x));
 vec3 c=bg*(.7+.35*p.y);
 vec2 grid=abs(fract(p*vec2(32.,18.))-.5);
 float g=max(smoothstep(.475,.495,grid.x),smoothstep(.475,.495,grid.y));
 c+=secondary*g*.025;
 float core=exp(-d/max(px,.0015)),glow=exp(-d/.018)*.24;
 float sheen=.8+.2*sin(p.x*8.-time*.5);
 c+=tint*(core*(1.1+treble*.3)+glow*(.6+energy))*sheen;
 c+=highlight*pow(core,3.)*.65;
 // A restrained reflected trace below the main ribbon of light.
 float echo=abs(p.y-(.22-trace*.09));
 c+=secondary*exp(-echo/.005)*.13;
 c+=motes(point(),0.)*.12;
 gl_FragColor=vec4(finish(c),1.);
}`;
