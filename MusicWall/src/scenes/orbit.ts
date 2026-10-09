import { common } from "./common";
export default common +
  `
void main(){
 vec2 p=point();vec3 c=bg;
 for(int i=0;i<24;i++){
  float f=float(i);if(f>12.+density*10.)break;
  float a=f*2.39996+time*.18*(1.-reduced);
  float radius=.14+sqrt(f)*(.18+bass*.055+pulse*.028);
  vec2 center=vec2(cos(a),sin(a))*radius;center.x*=1.2;
  vec2 q=rot(a+sin(time*.35+f)*mids*.6)*(p-center);
  q.x*=1.2;q.y*=.7+treble*.25;
  float size=.065+.07*hash(vec2(f,2)) + pulse*.018,d=length(q);
  float petal=1.-smoothstep(size-.009,size,d);
  vec3 col=mix(primary,secondary,fract(f*.27));
  col=mix(col,highlight,hash(vec2(f,6))*.3);
  vec2 uv=q/size;vec3 normal=vec3(uv,sqrt(max(.03,1.-dot(uv,uv))));
  col=material(col,normal,.75,.25);
  c*=1.-exp(-length(q-vec2(.025,-.035))*20.)*.22;
  c+=col*exp(-d*12.)*(.04+treble*.03);c=mix(c,col,petal);
  c+=highlight*exp(-abs(d-size*.76)*160.)*(.07+treble*.08);
 }
 c+=motes(p,0.)*.28;gl_FragColor=vec4(finish(c),1.);
}`;
