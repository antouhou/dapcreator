const { Transaction } = require('@dashevo/dashcore-lib');

/**
 * @param {string} regTxId
 * @param {string} senderPrivateKey
 * @param dapiClient
 * @param dpp
 * @param userProvider
 * @returns {Promise<string>}
 */
async function createProfile(regTxId, senderPrivateKey, dapiClient, dpp, userProvider) {
  const transitions = userProvider.getTransitions(regTxId);

  dpp.setUserId(regTxId);

  const profileDocument = dpp.document.create('profile', {
    avatarUrl: 'http://avatar.url',
    about: 'About.',
  });

  const result = dpp.document.validate(profileDocument);
  console.log('Contact validation result:', result);

  // 1. Create ST contact request packet
  const stPacket = dpp.packet.create([profileDocument]);
  const packetValidationResult = dpp.packet.validate(stPacket);
  console.log('Packet validation result:', packetValidationResult);

  // 2. Create State Transition
  const transaction = new Transaction()
    .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

  transaction.extraPayload
    .setRegTxId(regTxId)
    .setHashPrevSubTx(transitions[transitions.length - 1] || regTxId)
    .setHashSTPacket(stPacket.hash())
    .setCreditFee(1000)
    .sign(senderPrivateKey);

  console.log('Sending profile object to the network');
  return dapiClient.sendRawTransition(
    transaction.serialize(),
    stPacket.serialize().toString('hex'),
  );
}

module.exports = createProfile;
