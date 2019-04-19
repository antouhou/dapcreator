const DashPlatformProtocol = require('@dashevo/dpp');
const {PublicKey, Address, Transaction, PrivateKey} = require('@dashevo/dashcore-lib');
const entropy = require('@dashevo/dpp/lib/util/entropy');
const registerUser = require('../../../registerUser');
const schema = require('../../contracts/contacts.app');
const name = 'DashPayNativeDemo1';
const id = '84Cdj9cB6bakxC6SWCGns7bZxNg6b5VmPJ36pkVdzHw7';

const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';
const yellow = 33;
const blue = 34;

/**
 * @param {*} dapiClient
 * @param {string} userId
 * @param {string} privateKeyString
 * @returns {Promise<DashPlatformProtocol>}
 */
async function createContract(dapiClient, userId, privateKeyString) {
  console.log('Creating contract');
  const dpp = new DashPlatformProtocol();
  const privateKey = new PrivateKey(privateKeyString);
  const applicationSchema = schema;
  const regTxId = userId;
  console.log('Downloading user info');
  const user = await dapiClient.getUserById(regTxId);

  const dpContract = dpp.contract.create(name, applicationSchema);

  dpp.setContract(dpContract);

  const contractId = dpp.getContract().getId();
  if (contractId === id) {
    console.log(green, `Your contract id is ${contractId}`);
  } else {
    console.log(red, contractId, id);
    process.exit();
  }

  const contract = await dapiClient.fetchContract(contractId);
  if (contract) {
    console.log(green, 'Contract already registered on the network');
    console.log(green, 'Proceeding without registration');
  } else {
    // 1. Create ST packet
    const stPacket = dpp.packet.create(dpp.getContract());

    // 2. Create State Transition
    const transaction = new Transaction()
      .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

    transaction.extraPayload
      .setRegTxId(regTxId)
      .setHashPrevSubTx(user.subtx[0] || user.regtxid)
      .setHashSTPacket(stPacket.hash())
      .setCreditFee(1000)
      .sign(privateKey);

    console.log('Registering contract on the network');
    await dapiClient.sendRawTransition(
      transaction.serialize(),
      stPacket.serialize().toString('hex'),
    );
  }

  return dpp;
}

module.exports = createContract;
