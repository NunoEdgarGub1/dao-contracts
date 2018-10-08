const DaoIdentity = artifacts.require('DaoIdentity.sol');

const {
  getAccountsAndAddressOf,
} = require('./helpers');

const bN = web3.toBigNumber;

// deploy multisig wallet
// add this multisig wallet as the root account
module.exports = async function () {
  const addressOf = {};
  await web3.eth.getAccounts(async function (e, accounts) {
    console.log('ADD MULTISIGWALLET AS ROOT');
    console.log('');

    getAccountsAndAddressOf(accounts, addressOf);
    console.log('\taccounts \u2713');

    // get contract instance
    const daoIdentity = await DaoIdentity.deployed();
    console.log('\tcontract instances \u2713');

    // add multisig contract as root
    await daoIdentity.addGroupUser(
      bN(1), process.env.MULTISIG_WALLET,
      'add:multisig:root', { from: addressOf.root },
    );
    console.log('\tadd multisig as root \u2713');

    console.log('');
    console.log('PART-2 DONE');
  });
};
