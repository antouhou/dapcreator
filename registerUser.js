const { Transaction, PrivateKey } = require('@dashevo/dashcore-lib');

async function registerUser(privateKeyString, dapiClient) {

  const randomUserName = Math.random().toString(36).substring(7);
  const privateKey = new PrivateKey(privateKeyString);
  const address = privateKey.toAddress('testnet');
  const validPayload = new Transaction.Payload.SubTxRegisterPayload()
    .setUserName(randomUserName)
    .setPubKeyIdFromPrivateKey(privateKey).sign(privateKey);

  const inputs = await dapiClient.getUTXO(address.toString());

  const transaction = Transaction()
    .setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
    .setExtraPayload(validPayload)
    .from(inputs.slice(-1)[0])
    .addFundingOutput(10000)
    .change(address)
    .sign(privateKey);

  const { txid } = await dapiClient.sendRawTransaction(transaction.serialize());
  await dapiClient.generate(1);
  console.log(`Username is ${randomUserName}`);
  console.log(`regTxId is ${txid}`);
  return txid;
}

module.exports = registerUser;