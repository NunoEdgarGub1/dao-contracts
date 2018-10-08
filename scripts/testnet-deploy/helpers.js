const getAccountsAndAddressOf = function (accounts, addressOf) {
  const addressOfTemp = {
    root: accounts[0],
    prl: accounts[1],
    kycadmin: accounts[2],
    founderBadgeHolder: accounts[3],
    badgeHolders: [accounts[4], accounts[5], accounts[6]],
    dgdHolders: [accounts[7], accounts[8], accounts[9], accounts[10], accounts[11], accounts[12]],
    multiSigUsers: [accounts[13], accounts[14], accounts[15]],
  };
  for (const key in addressOfTemp) addressOf[key] = addressOfTemp[key];
};

module.exports = {
  getAccountsAndAddressOf,
};
