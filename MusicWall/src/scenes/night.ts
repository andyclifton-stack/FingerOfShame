import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=rot(-.18)*point();vec3 c=bg;float travel=time*.8,lanes=0.;
 for(int i=0;i<22;i++){
  float f=float(i);if(f>10.+density*10.)break;
  float x=p.x-travel;
  float y=sin(x*.85+f*.18)*.4+sin(x*1.9+f*.35)*(.11+mids*.15)+(f-10.)*.065;
  float d=abs(p.y-y);vec3 col=mix(primary,secondary,f/22.);
  float width=.003+bass*.007+pulse*.003;
  float depth=.4+.6*f/22.;lanes=max(lanes,exp(-d*45.));
  c+=col*exp(-d/(width+.003))*depth*.62;c+=col*exp(-d*22.)*.024;
  c+=mix(col,vec3(1.),.65)*exp(-d/(width*.22+.001))*depth*.16;
  float packets=pow(max(0.,sin(x*3.5-f*.8)),18.);
  c+=highlight*exp(-d*110.)*packets*(.1+treble*.3);
 }
 c+=motes(vec2(p.x,p.y-sin((p.x-travel)*.85)*.4),2.)*lanes*.5;
 gl_FragColor=vec4(finish(c),1.);
}`;
