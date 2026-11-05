globalThis.TK7MatchStats={
 score(value){
  if(value===null||value===undefined||value===''||typeof value==='boolean')return null;
  if(typeof value==='string'&&!/^\d+$/.test(value))return null;
  const number=Number(value);return Number.isSafeInteger(number)&&number>=0?number:null;
 },
 calculate(day,teams){
  const result={};if(!Array.isArray(day?.schedule)||!Array.isArray(day?.settings?.activeTeams))return result;
  for(const slug of day.settings.activeTeams){
   const team=teams.find(item=>item.slug===slug);if(!team)continue;
   result[slug]={name:team.name,slug,p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0};
  }
  for(const match of day.schedule){
   if(!match)continue;
   const home=Object.hasOwn(result,match.home)?result[match.home]:null;
   const away=Object.hasOwn(result,match.away)?result[match.away]:null;
   const a=this.score(match.homeScore),b=this.score(match.awayScore);
   if(!home||!away||home===away||a===null||b===null)continue;
   home.p++;away.p++;home.gf+=a;home.ga+=b;away.gf+=b;away.ga+=a;
   if(a>b){home.w++;away.l++;home.pts+=3}
   else if(b>a){away.w++;home.l++;away.pts+=3}
   else{home.d++;away.d++;home.pts++;away.pts++}
  }
  for(const team of Object.values(result))team.gd=team.gf-team.ga;
  return result;
 }
};
