var { EventEmitter, on } = require('events');

// Create an eventEmitter object
var eventEmitter = new EventEmitter();
module.exports = { eventEmitter, on };
