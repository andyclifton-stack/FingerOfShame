import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=point();vec3 c=bg;float travel=time*.18*(1.-reduced);
 for(int i=0;i<16;i++){
  float f=float(i),z=fract(f/16.+travel),scale=.07+z*z*2.65;
  vec2 q=rot(sin(time*.20+f*.15)*(.10+mids*.20)*(1.-reduced))*p;
  float box=max(abs(q.x)*.8,abs(q.y));
  float d=abs(box-scale*(1.+bass*.10+pulse*.08));
  float line=1.-smoothstep(.008,.018+z*.033,d);
  vec3 col=mix(primary,secondary,.5+.5*sin(f*.4+time*.2));
  float bevel=.5+.5*sin((box-scale)*90.);
  c+=col*line*(.1+z*.55)*(.55+bevel*.6);
  c+=vec3(1.)*exp(-abs(box-scale+.008)*280.)*z*.08;
  c+=highlight*exp(-d*65.)*z*(.06+treble*.12+pulse*.07);
 }
 c*=1.-.32*exp(-length(p)*9.);
 c+=motes(p*.8,1.)*smoothstep(.35,1.2,length(p))*.3;
 gl_FragColor=vec4(finish(c),1.);
}`;
