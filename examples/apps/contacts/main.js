const args = require('yargs').argv;
const DAPIClient = require('@dashevo/dapi-client');
const registerUser = require('../../../registerUser');
const createContract = require('./createContract');
const sendContactFactory = require('./sendContactFactory');
const createProfile = require('./createProfile');
const UserProvider = require('./UserProvider');
const Store = require('../../store');

const {seeds, private_key} = args;

async function wait(milliseconds) {
  console.log(`Waiting ${milliseconds / 1000} seconds`);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Continuing');
      resolve();
    }, milliseconds);
  });
}

async function main() {
  if (!seeds) {
    return console.log("Seeds aren't specified. Please specify seeds: --seeds='127.0.0.1,8.8.8.8'")
  }

  if (!private_key) {
    return console.log('Please specify a private key to sign a transition: --private_key="place_your_key_here"');
  }

  // Init api and storage
  const dapiClient = new DAPIClient({
    seeds: seeds.split(',').map(ip => {
      return {service: ip};
    }),
    timeout: 100000
  });
  const store = Store('contactsApp');
  const userProvider = new UserProvider(dapiClient, store);
  let tsId;

  // const regTxId = '7d185c76227708ac9d9720aeb8d78a3dda2d97aeaafc9722264607954f650c40';
  const regTxId = await registerUser(private_key, dapiClient);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());

  const dpp = await createContract(dapiClient, regTxId, private_key, userProvider);

  await wait(20000);

  const sendContact = sendContactFactory(dpp, dapiClient, userProvider);

  tsId = await createProfile(regTxId, private_key, dapiClient, dpp, userProvider);
  await userProvider.addTransition(regTxId, tsId);
  console.log('Profile sent', tsId);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());

  await wait(20000);

  // console.log(await dapiClient.fetchDocuments(
  // dpp.getContract().getId(), 'profile', { where: {'$userId': regTxId }}));

  tsId = await sendContact(regTxId, 'alice_user_id', 'key_to_share', private_key);
  console.log('Contact sent', tsId);
  console.log('Mining new block');
  await dapiClient.generate(1);
  console.log('Block mined', await dapiClient.getBestBlockHeight());
}

main().catch(console.error);
