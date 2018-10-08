const {
  getAccountsAndAddressOf,
} = require('./helpers');

module.exports = async function () {
  await web3.eth.getAccounts(async function (e, accounts) {
    const addressOf = {};
    getAccountsAndAddressOf(accounts, addressOf);

    console.log('ROOT           : ', addressOf.root);
    console.log('PRL            : ', addressOf.prl);
    console.log('KYC ADMIN      : ', addressOf.kycadmin);
    console.log('FOUNDER BADGE  : ', addressOf.founderBadgeHolder);
    console.log('BADGE HOLDER 0 : ', addressOf.badgeHolders[0]);
    console.log('BADGE HOLDER 1 : ', addressOf.badgeHolders[1]);
    console.log('BADGE HOLDER 2 : ', addressOf.badgeHolders[2]);
    console.log('DGD HOLDER 0   : ', addressOf.dgdHolders[0]);
    console.log('DGD HOLDER 1   : ', addressOf.dgdHolders[1]);
    console.log('DGD HOLDER 2   : ', addressOf.dgdHolders[2]);
    console.log('DGD HOLDER 3   : ', addressOf.dgdHolders[3]);
    console.log('DGD HOLDER 4   : ', addressOf.dgdHolders[4]);
    console.log('DGD HOLDER 5   : ', addressOf.dgdHolders[5]);
    console.log('MULTISIG 0     : ', addressOf.multiSigUsers[0]);
    console.log('MULTISIG 1     : ', addressOf.multiSigUsers[1]);
    console.log('MULTISIG 2     : ', addressOf.multiSigUsers[2]);
  });
};
