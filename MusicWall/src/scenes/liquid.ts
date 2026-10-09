import { common } from "./common";
export default common +
  `
float pool(vec2 p){
 float field=0.,t=time*.24;
 for(int i=0;i<6;i++){
  float f=float(i);vec2 q=vec2(sin(t*.64+f*2.3)*1.15,cos(t*.8+f*1.9)*.72);
  vec2 d=p-q;field+=(.6+bass*.18+pulse*.06)*exp(-dot(d,d)*3.1);
 }
 return field;
}
void main(){
 vec2 p=point();float field=pool(p);
 float height=smoothstep(.28,1.8,field),mask=smoothstep(.2,.45,field);
 vec2 slope=vec2(pool(p+vec2(.008,0.))-pool(p-vec2(.008,0.)),pool(p+vec2(0.,.008))-pool(p-vec2(0.,.008)))/.016;
 vec3 normal=normalize(vec3(-slope*.6,1.));
 float bands=.5+.5*sin(field*2.5+noise(p*1.5+time*.06)*mids);
 vec3 col=mix(primary,secondary,bands*.8);
 col=material(col,normal,.86,.28);
 float rim=pow(1.-normal.z,2.);
 col+=highlight*rim*(.15+treble*.14);
 vec3 c=mix(bg*(.65+.35*height),col,mask);
 float ripple=exp(-abs(length(p)-(.12+(1.-clamp(pulse,0.,1.))*1.65))*48.);
 c+=secondary*ripple*pulse*.15*mask;
 c+=motes(p,2.)*rim*.6;
 gl_FragColor=vec4(finish(c),1.);
}`;
