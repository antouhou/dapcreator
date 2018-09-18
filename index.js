const args = require('yargs').argv;
const DashSchema = require('@dashevo/dash-schema/dash-schema-lib');
const green = '\x1b[32m%s\x1b[0m';
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const hash2 = crypto.createHash('sha256');

const { schema } = args;

if (!schema) {
    console.log('Schema is not specified. Example: node index.js --schema=/path/to/shema.json');
}

console.log(`Loading schema from ${schema}...`);
const dashPaySchema = require(schema);
console.log(green, 'Shema loaded.');

var packet = DashSchema.create.stpacket();
var dap = DashSchema.create.dapcontract(dashPaySchema);
dap.pver = 1;
packet.stpacket = dap;

console.log(green, 'Raw packet:');
console.log(packet);

var packetBuffer = DashSchema.serialize.encode(packet);

console.log(green, 'Packet hex:');
console.log(packetBuffer.toString('hex'));

console.log(green, 'Packet hash:');
const hash1 = hash.update(packetBuffer).digest();
console.log(hash2.update(hash1).digest('hex'));
