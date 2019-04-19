const { Transaction } = require('@dashevo/dashcore-lib');
/**
 * @param protocol
 * @param client
 * @returns {function(string, string, string, string): Promise<string>}
 */
function sendContactRequestFactory(protocol, client) {
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
    const user = await dapiClient.getUserById(from);

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
      .setRegTxId(user.regtxid)
      .setHashPrevSubTx(user.subtx[0] || user.regtxid)
      .setHashSTPacket(stPacket.hash())
      .setCreditFee(1000)
      .sign(senderPrivateKey);

    console.log('Sending contact object to the network');
    return dapiClient.sendRawTransition(
      transaction.serialize(),
      stPacket.serialize().toString('hex'),
    );
  }
  return sendContactRequest;
}

module.exports = sendContactRequestFactory;
