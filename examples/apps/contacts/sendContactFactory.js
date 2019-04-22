const { Transaction } = require('@dashevo/dashcore-lib');
/**
 * @param protocol
 * @param client
 * @param {UserProvider} userProvider
 * @returns {function(string, string, string, string): Promise<string>}
 */
function sendContactRequestFactory(protocol, client, userProvider) {
  const dpp = protocol;
  const dapiClient = client;
  /**
   *
   * @param {string} from
   * @param {string} to
   * @param {string} extendedPublicKey
   * @param {string} senderPrivateKey
   * @returns {Promise<void>}
   */
  async function sendContactRequest(from, to, extendedPublicKey, senderPrivateKey) {
    console.log('Downloading user data');

    const transitions = await userProvider.getTransitions(from);

    dpp.setUserId(from);

    const bobContactRequest = dpp.document.create('contact', {
      toUserId: to,
      extendedPublicKey: extendedPublicKey,
    });

    const result = dpp.document.validate(bobContactRequest);
    console.log('Contact validation result:', result);

    // 1. Create ST contact request packet
    const stPacket = dpp.packet.create([bobContactRequest]);
    const packetValidationResult = dpp.packet.validate(stPacket);
    console.log('Packet validation result:', packetValidationResult);

    // 2. Create State Transition
    const transaction = new Transaction()
      .setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

    transaction.extraPayload
      .setRegTxId(from)
      .setHashPrevSubTx(transitions[transitions.length - 1] || from)
      .setHashSTPacket(stPacket.hash())
      .setCreditFee(1000)
      .sign(senderPrivateKey);

    console.log('Sending contact object to the network');
    const tsId = dapiClient.sendRawTransition(
      transaction.serialize(),
      stPacket.serialize().toString('hex'),
    );

    await userProvider.addTransition(from, tsId);
    return tsId;
  }
  return sendContactRequest;
}

module.exports = sendContactRequestFactory;
