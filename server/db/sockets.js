const fs = require('fs');
const path = require('path');
const https = require('https');

const env = process.env.NODE_ENV || 'development';
const config = require('dotenv').config().parsed;
console.log(config);
// const config = require('../../config/config.json')[env];
const file = (name) =>
  fs.readFileSync(path.resolve(process.cwd(), name), 'utf8').toString();

const WebSocket = require('ws');
const httpsOptions = {
  key: file(config.key),
  cert: file(config.cert),
};

const server = https.createServer(httpsOptions);
const wss = new WebSocket.Server({ server });
const connections = [];
wss.on('connection', (ws) => {
  connections.push(ws);
  console.error('new connection! count:', connections.length);

  ws.on('message', (message) => {
    console.log('wss message', message);
    connections
      .filter((client) => client !== ws)
      .forEach((client) => {
        client.send(message);
      });
  });
  ws.on('close', () => {
    const idx = connections.indexOf(ws);
    if (idx !== -1) connections.splice(idx, 1);
    console.error('closed connection. Count:', connections.length);
  });
  ws.send(JSON.stringify({ status: 'connected' }));
});

server.listen(config.wss, () => {
  console.log(`WebSockets listening on port: ${config.wss}`);
});

function broadcast(data) {
  const jData = JSON.stringify(data);
  connections.forEach((client) => {
    client.send(jData);
  });
}

module.exports = { broadcast };
