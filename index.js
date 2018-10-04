const args = require('yargs').argv;
const DashSchema = require('@dashevo/dash-schema/dash-schema-lib');
const green = '\x1b[32m%s\x1b[0m';
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const hash2 = crypto.createHash('sha256');
const hash3 = crypto.createHash('sha256');
const hash4 = crypto.createHash('sha256');

const { schema } = args;

if (!schema) {
    console.log('Schema is not specified. Example: node index.js --schema=/path/to/shema.json');
}

console.log(`Loading schema from ${schema}...`);
const dashPaySchema = require(schema);
console.log(green, 'Shema loaded.');

const packet = DashSchema.create.stpacket();
const dap = DashSchema.create.dapcontract(dashPaySchema);
const packetBuffer = DashSchema.serialize.encode(packet);
const dapBuffer = DashSchema.serialize.encode(dap.dapcontract);

const hash1 = hash.update(packetBuffer).digest();
const packetHash = hash2.update(hash1).digest('hex');

const dapId = crypto.createHash('sha256').update(crypto.createHash('sha256').update(dapBuffer).digest()).digest().toString('hex');

dap.pver = 1;
dap.dapid = dapId;
packet.stpacket = dap;

console.log(green, 'Raw packet:');
console.log(packet);

console.log(green, 'Packet hex:');
console.log(packetBuffer.toString('hex'));

console.log(green, 'Packet hash:');
console.log(packetHash);
