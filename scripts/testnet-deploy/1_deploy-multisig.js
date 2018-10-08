const MultiSigWallet = artifacts.require('MultiSigWallet.sol');

const {
  getAccountsAndAddressOf,
} = require('./helpers');

const bN = web3.toBigNumber;

// deploy the MultiSigWallet
module.exports = async function () {
  const addressOf = {};
  await web3.eth.getAccounts(async function (e, accounts) {
    console.log('DEPLOY MULTISIGWALLET');
    console.log('');

    getAccountsAndAddressOf(accounts, addressOf);
    console.log('\taccounts \u2713');

    await MultiSigWallet.new(addressOf.multiSigUsers, bN(2));
    console.log('\tmultisig wallet \u2713');

    console.log('');
    console.log('PART-1 DONE');
  });
};
