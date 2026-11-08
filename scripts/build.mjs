import fs from 'node:fs';
import {build} from 'esbuild';
import {readConfig} from './config.mjs';
readConfig();
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/vendor',{recursive:true});fs.cpSync('public','dist',{recursive:true});fs.cpSync('shared','dist/shared',{recursive:true});
for(const [src,dst] of [['three/build/three.module.js','three.module.js'],['three/build/three.core.js','three.core.js'],['socket.io-client/dist/socket.io.esm.min.js','socket.io.js'],['qrcode/build/qrcode.js','qrcode.js'],['xlsx/dist/xlsx.full.min.js','xlsx.js']]){if(fs.existsSync('node_modules/'+src))fs.copyFileSync('node_modules/'+src,'dist/vendor/'+dst);}
await build({entryPoints:['node_modules/qrcode/lib/browser.js'],outfile:'dist/vendor/qrcode.js',bundle:true,format:'esm',platform:'browser',minify:true});
await build({entryPoints:['node_modules/three/examples/jsm/loaders/GLTFLoader.js'],outfile:'dist/vendor/gltf-loader.js',bundle:true,format:'esm',platform:'browser',minify:true,plugins:[{name:'shared-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:'./three.module.js',external:true}));}}]});
if(!process.argv.includes('--site')){console.log('Built portable Node/Render game.');process.exit(0);}
const assets={};
// The hosted runtime embeds only runtime assets; old prototypes and reference images stay in the source archive.
const runtimeRoots=new Set(['index.html','player.html','mc.html','mila.css','mila-app.js','mila-scene.js','transport.js','joystick.js','HUONG_DAN.html']);
function runtimeFile(key){const p=key.slice(1);return runtimeRoots.has(p)||p.startsWith('shared/')||(p.startsWith('assets/mila/')&&!p.includes('approved-'))||p.endsWith('.ogg')||p==='vendor/qrcode.js'||p==='vendor/socket.io.js';}

const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mp4':'video/mp4','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.json':'application/json'};
function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())collect(file);else{const ext=file.slice(file.lastIndexOf('.')),key='/'+file.slice(5),type=mime[ext]||'application/octet-stream';if(!runtimeFile(key))continue;assets[key]=['.html','.css','.js','.svg'].includes(ext)?{type,text:fs.readFileSync(file,'utf8')}:{type,base64:fs.readFileSync(file).toString('base64')};}}}
collect('dist');
fs.mkdirSync('dist/server',{recursive:true});
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',minify:true,plugins:[{name:'local-assets',setup(b){b.onResolve({filter:/^arcana:assets$/},()=>({path:'assets',namespace:'arcana'}));b.onLoad({filter:/.*/,namespace:'arcana'},()=>({contents:JSON.stringify(assets),loader:'json'}));}}]});
console.log('Built frontend, Node/Render assets and hosted Worker with DB.');
