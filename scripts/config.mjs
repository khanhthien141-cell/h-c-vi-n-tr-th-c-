import fs from 'node:fs';
export function readConfig(){
 const c=JSON.parse(fs.readFileSync('public/config/game.json','utf8'));
 if(!c.brand?.name||c.brand.name.length>40)throw Error('Tên game cần 1–40 ký tự.');
 for(const v of Object.values(c.theme||{}))if(!/^#[\da-f]{6}$/i.test(v))throw Error('Màu phải có dạng #aabbcc.');
 const local=p=>!p||/^(?:\.\/|\/)?assets\/[a-zA-Z0-9_./-]+$/.test(p)&&!p.includes('..');
 for(const p of [c.music?.lobby,c.music?.battle])if(!local(p))throw Error('Nhạc phải là đường dẫn assets trong bộ game.');
 if(!Number.isFinite(c.music?.volume)||c.music.volume<0||c.music.volume>1)throw Error('Âm lượng từ 0 đến 1.');
 for(const n of ['semiSeconds','finalSeconds','demoSeconds'])if(!Number.isInteger(c.match?.[n])||c.match[n]<30||c.match[n]>1800)throw Error('Thời gian trận từ 30 đến 1800 giây.');
 const ids=['sol','luna','ivy','kai','ember','nova','sage','raven','atlas','faye','milo','zephyr'];
 for(const [key,h]of Object.entries(c.heroes||{})){if(!ids.includes(key))throw Error('ID tướng chưa đúng: '+key);if(h.color&&!/^#[\da-f]{6}$/i.test(h.color))throw Error('Màu tướng chưa đúng.');for(const [n,min,max]of [['hp',50,500],['damage',5,60],['speed',3,12],['modelScale',.1,5],['modelRotation',-360,360]])if(h[n]!==undefined&&(!Number.isFinite(h[n])||h[n]<min||h[n]>max))throw Error(`${key}.${n}: từ ${min} đến ${max}.`);if(!local(h.model)||!local(h.portrait))throw Error('Model/ảnh phải nằm trong assets.');if(h.model&&!/\.(glb|gltf)$/i.test(h.model))throw Error('Model cần .glb hoặc .gltf.');if(h.name&&(typeof h.name!=='string'||h.name.length>24))throw Error('Tên tướng tối đa 24 ký tự.');}
 fs.writeFileSync('shared/customization.js','// Generated from public/config/game.json by npm run build.\nexport const customization='+JSON.stringify(c)+';\n');return c;
}
