import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=rot(-.24)*point();vec3 c=bg;
 float travel=time*.72;float width=.16+bass*.105+pulse*.045;
 for(int i=0;i<7;i++){
  float f=float(i),x=p.x-travel;
  float center=(f-3.)*.255+sin(x*1.12+f*.58)*(.24+mids*.17)+sin(x*2.15+f)*(.065+pulse*.018);
  float d=(p.y-center)/width,edge=1.-smoothstep(.90,1.02,abs(d));
  float fold=.5+.5*sin(d*2.3+f*.4+p.x*.7);
  float silk=pow(max(0.,1.-abs(d+.26)),7.);
  vec3 shade=mix(primary,secondary,.5+.5*sin(f*.68+x*.35));
  vec3 normal=normalize(vec3(sin(x*1.12+f*.58)*.3,d*.8,sqrt(max(.04,1.-d*d*.8))));
  shade=material(shade,normal,.66,.3)*(.65+.35*fold);
  shade+=highlight*silk*(.12+treble*.18+pulse*.13);
  c*=1.-exp(-abs(d-1.22)*4.)*.5;c=mix(c,shade,edge);
  c+=secondary*exp(-abs(abs(d)-.93)*70.)*(.12+treble*.12);
 }
 float lanes=pow(max(0.,sin((p.y-sin((p.x-travel)*1.12)*.26)*12.3)),6.);
 c+=motes(vec2(p.x,p.y-sin((p.x-travel)*1.12)*.26),1.)*lanes*.7;
 gl_FragColor=vec4(finish(c),1.);
}`;
