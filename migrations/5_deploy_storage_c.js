const ContractResolver = artifacts.require('ContractResolver.sol');
const DaoStructs = artifacts.require('DaoStructs.sol');

const DaoFundingStorage = artifacts.require('DaoFundingStorage.sol');
const DaoRewardsStorage = artifacts.require('DaoRewardsStorage.sol');
const DaoWhitelistingStorage = artifacts.require('DaoWhitelistingStorage.sol');
const IntermediateResultsStorage = artifacts.require('IntermediateResultsStorage.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.link(DaoStructs, IntermediateResultsStorage)
    .then(() => {
      return deployer.link(DaoStructs, DaoRewardsStorage);
    })
    .then(() => {
      return deployer.deploy(DaoWhitelistingStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoFundingStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoRewardsStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(IntermediateResultsStorage, ContractResolver.address);
    })
    .then(() => {
      console.log('Deployed Storage Part C');
    });
};
