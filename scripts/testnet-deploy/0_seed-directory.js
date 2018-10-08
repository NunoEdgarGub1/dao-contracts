const a = require('awaiting');

const DaoIdentity = artifacts.require('DaoIdentity.sol');
const DGDToken = artifacts.require('MockDgd.sol');
const DGDBadgeToken = artifacts.require('MockBadge.sol');
const NumberCarbonVoting1 = artifacts.require('NumberCarbonVoting1.sol');
const NumberCarbonVoting2 = artifacts.require('NumberCarbonVoting2.sol');

const {
  getAccountsAndAddressOf,
} = require('./helpers');

const bN = web3.toBigNumber;

// add members to DigixDAO directory
// transfer tokens to these members
// mark carbon vote votes for some participants
module.exports = async function () {
  const addressOf = {};
  await web3.eth.getAccounts(async function (e, accounts) {
    console.log('SEEDING DIRECTORY');
    console.log('TRANSFERRING DUMMY TOKENS');
    console.log('ADDING DUMMY DATA TO CARBON VOTING CONTRACTS');
    console.log('');

    getAccountsAndAddressOf(accounts, addressOf);
    console.log('\taccounts \u2713');

    // get contract instances
    const daoIdentity = await DaoIdentity.deployed();
    const dgdToken = await DGDToken.deployed();
    const badgeToken = await DGDBadgeToken.deployed();
    const numberCarbonVoting1 = await NumberCarbonVoting1.deployed();
    const numberCarbonVoting2 = await NumberCarbonVoting2.deployed();
    console.log('\tcontract instances \u2713');

    // add members to the directory
    await daoIdentity.addGroupUser(bN(2), addressOf.founderBadgeHolder, 'add:founder', { from: addressOf.root });
    await daoIdentity.addGroupUser(bN(3), addressOf.prl, 'add:prl', { from: addressOf.root });
    await daoIdentity.addGroupUser(bN(4), addressOf.kycadmin, 'add:kycadmin', { from: addressOf.root });
    console.log('\tadd users to directory \u2713');

    // transfer some DGDs and DGD Badges to members
    await a.map(addressOf.badgeHolders, 20, async (badgeHolder) => {
      await dgdToken.transfer(badgeHolder, bN(500 * (10 ** 9)), { from: addressOf.root });
      await badgeToken.transfer(badgeHolder, bN(5), { from: addressOf.root });
    });
    console.log('\ttransfer DGD Badges \u2713');
    await a.map(addressOf.dgdHolders, 20, async (dgdHolder) => {
      await dgdToken.transfer(dgdHolder, bN(100 * (10 ** 9)), { from: addressOf.root });
    });
    console.log('\ttransfer DGDs \u2713');

    // mark some votes in carbon voting
    await numberCarbonVoting1.mock_set_voted(addressOf.badgeHolders[0]);
    await numberCarbonVoting1.mock_set_voted(addressOf.badgeHolders[1]);
    await numberCarbonVoting1.mock_set_voted(addressOf.dgdHolders[0]);
    await numberCarbonVoting1.mock_set_voted(addressOf.dgdHolders[1]);
    await numberCarbonVoting1.mock_set_voted(addressOf.dgdHolders[2]);
    await numberCarbonVoting1.mock_set_voted(addressOf.dgdHolders[3]);
    await numberCarbonVoting2.mock_set_voted(addressOf.badgeHolders[0]);
    await numberCarbonVoting2.mock_set_voted(addressOf.badgeHolders[1]);
    await numberCarbonVoting2.mock_set_voted(addressOf.badgeHolders[2]);
    await numberCarbonVoting2.mock_set_voted(addressOf.dgdHolders[2]);
    await numberCarbonVoting2.mock_set_voted(addressOf.dgdHolders[3]);
    await numberCarbonVoting2.mock_set_voted(addressOf.dgdHolders[4]);
    await numberCarbonVoting2.mock_set_voted(addressOf.dgdHolders[5]);
    console.log('\tadd dummy data to carbon votings \u2713');

    console.log('');
    console.log('PART-0 DONE');
  });
};
