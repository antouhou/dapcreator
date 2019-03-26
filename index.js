const args = require('yargs').argv;
const DashPlatformProtocol = require('@dashevo/dpp');
const DAPIClient = require('@dashevo/dapi-client');
const {PublicKey, Address, Transaction, PrivateKey} = require('@dashevo/dashcore-lib');
const entropy = require('@dashevo/dpp/lib/util/entropy');
const registerUser = require('./registerUser');

const green = '\x1b[32m%s\x1b[0m';

const {schema, seeds, private_key} = args;

const dpp = new DashPlatformProtocol();

async function main() {

  if (!schema) {
    return console.log('Schema is not specified. Example: node index.js --schema=/path/to/shema.json');
  }

  if (!seeds) {
    return console.log("Seeds aren't specified. Please specify seeds: --seeds='127.0.0.1,8.8.8.8'")
  }

  if (!private_key) {
    return console.log('Please specify a private key to sign a transition: --private_key="place_your_key_here"');
  }

  const privateKey = new PrivateKey(private_key);
  const applicationSchema = require(schema);

  const dapiClient = new DAPIClient({
    seeds: seeds.split(',').map(ip => {
      return {service: ip};
    }),
  });

  const regTxId = await registerUser(private_key, dapiClient);

  const dpContract = dpp.contract.create(entropy.generate(), applicationSchema);

  dpp.setContract(dpContract);

  // 1. Create ST packet
  const stPacket = dpp.packet.create(dpp.getContract());

  // 2. Create State Transition
  const transaction = new Transaction()
    .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

  transaction.extraPayload
    .setRegTxId(regTxId)
    .setHashPrevSubTx(regTxId)
    .setHashSTPacket(stPacket.hash())
    .setCreditFee(1000)
    .sign(privateKey);

  const transitionHash = await dapiClient.sendRawTransition(
    transaction.serialize(),
    stPacket.serialize().toString('hex'),
  );

  await dapiClient.generate(1);

  const contractId = dpp.getContract().getId();
  console.log(green, `Your contract id is ${contractId}`);
}

main().catch(console.error);
