export const common = `
precision highp float;
varying vec2 vUv;
uniform vec2 resolution;
uniform float time, bass, mids, treble, energy, pulse, motion, richness, density, reduced, particles;
uniform vec3 bg, primary, secondary, highlight;
const float PI=3.14159265359;
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
vec2 point(){vec2 p=vUv*2.-1.;p.x*=resolution.x/resolution.y;return p;}
// A consistent softbox light, rounded normals and restrained reflections give each
// scene its own material without loading external environment maps.
vec3 material(vec3 base,vec3 normal,float gloss,float metal){
 vec3 n=normalize(normal),l=normalize(vec3(-.45,.65,1.2)),v=vec3(0.,0.,1.);
 float diffuse=max(0.,dot(n,l));
 float spec=pow(max(0.,dot(n,normalize(l+v))),mix(12.,100.,gloss));
 float fresnel=pow(1.-max(0.,n.z),3.);
 return base*(.28+.72*diffuse)+mix(vec3(1.),highlight,metal)*spec*(.18+gloss*.6)+secondary*fresnel*.2;
}
// Advected grains, stars or droplets. Neighbour cells prevent popping at cell edges.
// Stable seeds and bounded loops keep this usable on phones as well as large screens.
vec3 motes(vec2 p,float style){
 if(particles<=0. || energy<.002)return vec3(0.);
 vec3 light=vec3(0.);
 for(int layer=0;layer<2;layer++){
  if(layer==1 && density<.5)break;
  float l=float(layer);vec2 uv=p*vec2(6.5,5.)*(1.+l*.55);
  uv.y+=sin(p.x*1.7-time*.3+l)*(.6+mids*.8);
  uv-=vec2(time*(1.1+l*.4),time*.12);
  vec2 cell=floor(uv),local=fract(uv);
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
   vec2 offset=vec2(float(x),float(y));vec2 id=cell+offset;
   float seed=hash(id+vec2(l*71.,17.));
   if(seed>min(.55,(.10+min(density,1.)*.16)*particles))continue;
   vec2 at=.16+.68*vec2(hash(id+3.7+l),hash(id+27.1));
   vec2 d=local-offset-at;
   float size=(.018+hash(id+5.3)*.022)*(1.+treble*.25+pulse*.35);
   float distance2=dot(d,d);
   float core=exp(-distance2/(size*size));
   float halo=exp(-distance2/(size*size*12.))*.10;
   if(style>.5 && style<1.5){
    core+=exp(-abs(d.x)/(.008+size*.08)-abs(d.y)/(size*3.8))*.46;
    core+=exp(-abs(d.y)/(.008+size*.08)-abs(d.x)/(size*3.8))*.46;
   }
   if(style>1.5){vec2 drop=d*vec2(1.,.58);core=exp(-dot(drop,drop)/(size*size));}
   vec3 tint=mix(secondary,highlight,.4+seed*.6);
   float accent=mix(.35,1.,smoothstep(.45,.95,hash(id+91.)));
   light+=tint*(core+halo)*(.06+treble*.32+energy*.16+pulse*.6*accent)*smoothstep(.002,.12,energy)*(1.-reduced*.65)/(1.+l*.7);
  }
 }
 return light;
}
vec3 finish(vec3 c){float vignette=1.-.20*pow(length(vUv-.5),1.4);float grey=dot(c,vec3(.2126,.7152,.0722));vec3 saturated=max(vec3(0.),mix(vec3(grey),c,richness));return saturated/(1.+saturated*.12)*vignette;}
`;
