import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=point();float r=length(p),a=atan(p.y,p.x)+time*.13*(1.-reduced);
 vec3 c=bg;float sectors=10.;
 float angle=mod(a+PI/sectors,2.*PI/sectors)-PI/sectors;
 float facet=1.-abs(angle)*sectors/PI;
 for(int i=0;i<5;i++){
  float f=float(i),radius=(.22+f*.15)*(1.+bass*.27+pulse*.15);
  float boundary=radius*(.72+.28*facet)+mids*.045*sin(a*5.+f);
  float mask=1.-smoothstep(-.006,.006,r-boundary);
  float inner=1.-smoothstep(.015,.04,abs(r-boundary));
  vec3 col=mix(primary,secondary,f/5.);
  float light=.38+.45*abs(sin(a*5.+f*.6))+.16*sin(r*16.-f);
  vec3 normal=vec3(cos(a-angle)*(.35+f*.1),sin(a-angle)*(.35+f*.1),.85);
  col=material(col,normal,.95,.6)*(.65+.35*light);
  c*=1.-exp(-abs(r-boundary-.025)*50.)*.28;
  c=mix(c,col,mask);c+=highlight*inner*(.08+treble*.13);
 }
 c+=secondary*.065*exp(-r*1.5);
 c+=motes(rot(-time*.04*(1.-reduced))*p,1.)*smoothstep(.65,.9,r)*.45;
 gl_FragColor=vec4(finish(c),1.);
}`;
