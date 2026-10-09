import { common } from "./common";
export default common +
  `
uniform float spectrum[32];
void main(){
 vec2 p=vUv;float x=clamp((p.x-.08)/.84,0.,.9999)*32.;int idx=int(floor(x));
 float local=fract(x),height=.025+spectrum[idx]*.38;
 float floorY=.42,y=p.y-floorY;
 vec3 tint=mix(primary,secondary,float(idx)/31.);
 vec3 c=bg*(.65+.5*p.y);
 float grid=pow(max(0.,cos((p.x-.5)*PI*24./max(.12,p.y+.05))),40.);
 c+=secondary*grid*.022*smoothstep(.3,0.,p.y);
 float face=smoothstep(.08,.14,local)*smoothstep(.86,.8,local);
 float body=face*smoothstep(-.002,.002,y)*smoothstep(height+.002,height-.002,y);
 float edge=smoothstep(.14,.24,local)*smoothstep(.8,.72,local);
 vec3 n=normalize(vec3((local-.5)*1.3,.22,1.));
 vec3 glass=material(tint*(.45+.55*clamp(y/max(height,.01),0.,1.)),n,.95,.5);
 glass+=highlight*pow(1.-abs(local-.3),26.)*.38;
 glass+=secondary*(1.-edge)*.25;
 c=mix(c,glass,body);
 float cap=face*exp(-abs(y-height)/.0035);
 c+=highlight*cap*(.45+treble*.35+pulse*.2);
 float reflection=face*smoothstep(-height*.45,-height*.45+.01,y)*smoothstep(0.,-.006,y);
 c+=tint*reflection*exp(y*18.)*.23;
 c+=secondary*exp(-abs(y)/.004)*.25;
 c+=motes(point(),1.)*.18;
 gl_FragColor=vec4(finish(c),1.);
}`;
