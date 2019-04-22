const DashPlatformProtocol = require('@dashevo/dpp');
const {PublicKey, Address, Transaction, PrivateKey} = require('@dashevo/dashcore-lib');
const entropy = require('@dashevo/dpp/lib/util/entropy');
const registerUser = require('../../../registerUser');
const schema = require('../../contracts/contacts.app');
let name = 'ContactApp';
name = Date.now().toString(36);
const id = '84Cdj9cB6bakxC6SWCGns7bZxNg6b5VmPJ36pkVdzHw7';

const green = '\x1b[32m%s\x1b[0m';
const red = '\x1b[31m%s\x1b[0m';
const yellow = '\x1b[33m%s\x1b[0m';
const blue = 34;

/**
 * @param {*} dapiClient
 * @param {string} userId
 * @param {string} privateKeyString
 * @param {UserProvider} userProvider
 * @returns {Promise<DashPlatformProtocol>}
 */
async function createContract(dapiClient, userId, privateKeyString, userProvider) {
  console.log('Creating contract');
  const dpp = new DashPlatformProtocol();
  const privateKey = new PrivateKey(privateKeyString);
  const applicationSchema = schema;
  const regTxId = userId;

  const transitions = userProvider.getTransitions(regTxId);

  console.log('Contract name', name);
  const dpContract = dpp.contract.create(name, applicationSchema);

  dpp.setContract(dpContract);

  const contractId = dpp.getContract().getId();
  if (contractId === id) {
    console.log(green, `Your contract id is ${contractId}`);
  } else {
    console.log(red, 'Contract was modified', contractId, id);
  }

  let contract;
  try {
    contract = await dapiClient.fetchContract(contractId);
  } catch (e) {

  }
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
      .setHashPrevSubTx(transitions[transitions.length - 1] || userId)
      .setHashSTPacket(stPacket.hash())
      .setCreditFee(1000)
      .sign(privateKey);

    console.log(yellow, 'Registering contract on the network');
    const tsId = await dapiClient.sendRawTransition(
      transaction.serialize(),
      stPacket.serialize().toString('hex'),
    );

    await userProvider.addTransition(regTxId, tsId);

    console.log('Mining new block');
    await dapiClient.generate(1);
    console.log('Block mined', await dapiClient.getBestBlockHeight());
  }

  return dpp;
}

module.exports = createContract;
