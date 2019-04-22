const { Transaction, PrivateKey } = require('@dashevo/dashcore-lib');

async function getInputsWithRetries(dapiClient, address, retries) {
  console.log(`Try ${retries}`);
  const inputs = await dapiClient.getUTXO(address);
  if (retries > 0 && !inputs.items) {
    return getInputsWithRetries(dapiClient, address,retries - 1);
  }
  return inputs;
}

async function registerUser(privateKeyString, dapiClient) {

  const randomUserName = Math.random().toString(36).substring(7);
  const privateKey = new PrivateKey(privateKeyString);
  const address = privateKey.toAddress('testnet');
  const validPayload = new Transaction.Payload.SubTxRegisterPayload()
    .setUserName(randomUserName)
    .setPubKeyIdFromPrivateKey(privateKey).sign(privateKey);

  const inputs = await getInputsWithRetries(dapiClient, address.toString(), 100);
  if (!inputs.items) {
    throw new Error(`Can't find any inputs for the address ${address.toString()}`);
  }

  const transaction = Transaction()
    .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
    .setExtraPayload(validPayload)
    .from(inputs.items.slice(-1)[0])
    .addFundingOutput(100000)
    .change(address)
    .sign(privateKey);

  const txid = await dapiClient.sendRawTransaction(transaction.serialize());
  console.log(`Username is ${randomUserName}`);
  console.log(`regTxId is ${txid}`);
  return txid;
}

module.exports = registerUser;
