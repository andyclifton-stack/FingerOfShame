import { common } from "./common";
export default common +
  `
void main(){
 vec2 world=point();vec2 p=world*3.7;
 p+=vec2(sin(p.y*.7-time*.8),cos(p.x*.6-time*.6))*mids*.19*(1.-reduced);
 vec2 id=floor(p),q=fract(p)-.5;float h=hash(id);
 float band=.5+.5*sin(length(id+vec2(.5))*1.05-time*1.8);
 float row=.5+.5*sin(id.x*.7+id.y*.5-time*.9);
 float tilt=(sin(time*.7+id.y*.7)*mids*.3+pulse*.24*sin(id.x*.8+id.y))*(1.-reduced);
 q=rot(tilt)*q;
 float flip=cos((sin(time*.65+id.x*.55)*mids*1.05+pulse*.62)*(1.-reduced));
 q.x/=max(.35,abs(flip));
 float size=.245+bass*.09+pulse*.045+band*mids*.035;
 float d=max(abs(q.x),abs(q.y)),tile=1.-smoothstep(size-.015,size,d);
 vec3 col=mix(primary,secondary,clamp(h*.65+row*.35,0.,1.));
 col=mix(col,highlight,smoothstep(.76,.99,h)*(.28+treble*.35));
 float bevel=smoothstep(-.4,.4,q.y-q.x);
 vec2 rounded=clamp(q/(size+.001),-1.,1.);
 vec3 normal=vec3(rounded.x*pow(abs(rounded.x),8.)*.8+sin(tilt)*.5,rounded.y*pow(abs(rounded.y),8.)*.8,1.);
 col=material(col,normal,.85,.48)*(.65+.22*bevel+.15*band*energy+.2*pulse*(.4+row*.6));
 float shadow=exp(-length(max(abs(q-vec2(.035,-.045))-size,0.))*18.);
 vec3 c=bg*(1.-shadow*.6)+col*tile;
 float reflection=exp(-pow((q.x+q.y*.65+.13+sin(time*.2)*.025)/.065,2.));
 c+=mix(highlight,vec3(1.),.5)*reflection*tile*.13;
 float rim=exp(-abs(d-size)*95.);
 c+=mix(secondary,highlight,.3)*rim*(.10+treble*.28+pulse*.20);
 float inner=exp(-abs(d-size*.74)*100.);
 c+=highlight*inner*tile*(.04+mids*.10);
 c+=motes(world,1.)*tile*.3;
 gl_FragColor=vec4(finish(c),1.);
}`;
