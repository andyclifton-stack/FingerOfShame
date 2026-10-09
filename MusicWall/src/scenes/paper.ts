import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=rot(.10)*point();vec3 c=bg;float travel=time*.85;
 for(int i=0;i<10;i++){
  float f=9.-float(i),x=p.x-travel;
  float y=(f-4.5)*.255+sin(x*1.10+f*.48)*(.23+bass*.14)+sin(x*2.35+f*.65)*(.035+mids*.085);
  y+=pulse*.032*sin(x*3.+f);
  float d=p.y-y,mask=1.-smoothstep(-.008,.008,d);
  c*=1.-.5*exp(-abs(d-.055)*22.);
  vec3 col=mix(primary,secondary,.5+.5*sin(f*.55));
  col=mix(col,highlight,mod(f,3.)*.07);
  col*=.48+f*.058;col+=noise(vec2(x,p.y)*170.)*.010;
  col+=highlight*exp(-abs(d+.03)*18.)*.07;
  c=mix(c,col,mask);
  c+=highlight*exp(-abs(d)*150.)*(.06+treble*.13+pulse*.07);
  float current=pow(max(0.,sin(x*3.5-f*.8)),16.);
  c+=secondary*exp(-abs(d-.035)*42.)*current*(.04+mids*.12);
 }
 float channel=pow(max(0.,sin((p.y-sin((p.x-travel)*1.10)*.28)*13.)),10.);
 c+=motes(vec2(p.x,p.y-sin((p.x-travel)*1.10)*.28),0.)*channel*.55;
 gl_FragColor=vec4(finish(c),1.);
}`;
