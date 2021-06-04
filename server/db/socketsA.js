const WebSocket = require('ws');
const addSockets = (server) => {
  const wws = new WebSocket.Server({ server });
  const connections = [];

  wws.on('connection', (ws) => {
    connections.push(ws);
    console.log('new connection! count:', connections.length);

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
      console.log('closed connection. Count:', connections.length);
    });
  });
  function broadcast(data) {
    const jData = JSON.stringify(data);
    connections.forEach((client) => {
      client.send(jData);
    });
  }
  return { broadcast };
};

module.exports = addSockets;
