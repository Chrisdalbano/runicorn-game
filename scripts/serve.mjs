import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const port=Number(process.env.PORT||4173),root=process.cwd();
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{let b=fs.readFileSync(file);if(file.endsWith('game.js'))b=Buffer.from('const __DEV__=true;\n'+b);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(b);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Runicorn: http://127.0.0.1:${port}`));
