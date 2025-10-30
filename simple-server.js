const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.mp4': 'video/mp4',
};

console.log('Starting server...');

http.createServer((request, response) => {
    console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
    
    let filePath = '.' + request.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.error(`Error serving ${filePath}:`, error);
            if (error.code === 'ENOENT') {
                response.writeHead(404);
                response.end(`File not found: ${filePath}`);
            } else {
                response.writeHead(500);
                response.end(`Server error: ${error.code}`);
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
            console.log(`Successfully served ${filePath}`);
        }
    });
}).listen(5500);

console.log('Server running at http://localhost:5500/');