const args = require('yargs').argv;
const DAPIClient = require('@dashevo/dapi-client');
const registerUser = require('../../../registerUser');
const createContract = require('./createContract');
const sendContactFactory = require('./sendContactFactory');

const {seeds, private_key} = args;

async function main() {
  if (!seeds) {
    return console.log("Seeds aren't specified. Please specify seeds: --seeds='127.0.0.1,8.8.8.8'")
  }

  if (!private_key) {
    return console.log('Please specify a private key to sign a transition: --private_key="place_your_key_here"');
  }

  const dapiClient = new DAPIClient({
    seeds: seeds.split(',').map(ip => {
      return {service: ip};
    }),
    timeout: 100000
  });

  const regTxId = await registerUser(private_key, dapiClient);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());

  const dpp = await createContract(dapiClient, regTxId, private_key);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());

  const sendContact = sendContactFactory(dpp, dapiClient);

  await sendContact(regTxId, 'alice_user_id', 'key_to_share', private_key);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());
}

main().catch(console.error);
