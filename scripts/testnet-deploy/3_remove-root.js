const DaoIdentity = artifacts.require('DaoIdentity.sol');
const MultiSigWallet = artifacts.require('MultiSigWallet.sol');

const {
  getAccountsAndAddressOf,
} = require('./helpers');

const bN = web3.toBigNumber;

// remove the original root account from root group
module.exports = async function () {
  const addressOf = {};
  await web3.eth.getAccounts(async function (e, accounts) {
    console.log('REMOVE ORIGINAL ROOT FROM ROOT GROUP IN DIRECTORY');
    console.log('');

    getAccountsAndAddressOf(accounts, addressOf);
    console.log('\taccounts \u2713');

    const daoIdentity = await DaoIdentity.deployed();
    const multiSigWallet = MultiSigWallet.at(process.env.MULTISIG_WALLET);
    console.log('\tcontract instances \u2713');

    const { data } = daoIdentity.removeGroupUser.request(addressOf.root).params[0];
    const txnId = await multiSigWallet.submitTransaction.call(daoIdentity.address, bN(0), data, { from: addressOf.multiSigUsers[0] });
    console.log('\ttransaction data \u2713');

    await multiSigWallet.submitTransaction(daoIdentity.address, bN(0), data, { from: addressOf.multiSigUsers[0] });
    console.log('\tsubmit transaction \u2713');

    await multiSigWallet.confirmTransaction(txnId, { from: addressOf.multiSigUsers[1] });
    console.log('\tconfirm transaction \u2713');

    console.log('');
    console.log('PART-3 DONE');
  });
};
