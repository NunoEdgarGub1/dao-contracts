const Dao = artifacts.require('Dao.sol');
const DaoFundingManager = artifacts.require('DaoFundingManager.sol');

const {
  getAccountsAndAddressOf,
} = require('./helpers');

const {
  getCurrentTimestamp,
} = require('@digix/helpers/lib/helpers');

const bN = web3.toBigNumber;

// founder sets start of DigixDAO
module.exports = async function () {
  const addressOf = {};
  await web3.eth.getAccounts(async function (e, accounts) {
    console.log('START DIGIXDAO');
    console.log('');

    getAccountsAndAddressOf(accounts, addressOf);
    console.log('\taccounts \u2713');

    // get contract instance
    const dao = await Dao.deployed();
    const daoFundingManager = await DaoFundingManager.deployed();
    console.log('\tcontract instances \u2713');

    // fund the dao
    web3.eth.sendTransaction({
      from: addressOf.root,
      to: daoFundingManager.address,
      value: web3.toWei(10, 'ether'),
    }, function (e, r) {
      console.log('\ttx = ', r);
      console.log('\tfund dao \u2713');
    });

    // set start of digixdao
    await dao.setStartOfFirstQuarter(bN(getCurrentTimestamp()), { from: addressOf.founderBadgeHolder });
    console.log('\tset start \u2713');

    console.log('');
    console.log('PART-4 DONE');
  });
};
