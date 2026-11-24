const seen={},dups=[];for(const k in DB){if(isAuto(k))continue;(poolDe(k)||[]).forEach(a=>{if(seen[a.nm]&&seen[a.nm]!==k)dups.push(a.nm+" ("+seen[a.nm]+"/"+k+")");seen[a.nm]=k;});}
const miss=[];["malaga","bilbao","napoles","tokio"].forEach(k=>DB[k].concat(EXTRAS[k]||[]).forEach(a=>{if(!COORDS[a.nm])miss.push(a.nm);}));
return "duplicados: "+(dups.join(", ")||"ninguno")+"\nsin coords: "+(miss.join(", ")||"ninguno")+"\nresolveKey: "+["Málaga","Bilbao","Nápoles","Napoli","Tokio","Tokyo"].map(c=>{inDest.dataset.key="";return c+"→"+resolveKey(c);}).join(" ");
