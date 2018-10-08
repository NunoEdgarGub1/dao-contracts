const ContractResolver = artifacts.require('ContractResolver.sol');
const DaoStructs = artifacts.require('DaoStructs.sol');

const DaoRewardsManager = artifacts.require('DaoRewardsManager.sol');
const DaoRewardsManagerExtras = artifacts.require('DaoRewardsManagerExtras.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.link(DaoStructs, DaoRewardsManager)
    .then(() => {
      return deployer.deploy(DaoRewardsManager, ContractResolver.address, process.env.DGX);
    })
    .then(() => {
      return deployer.deploy(DaoRewardsManagerExtras, ContractResolver.address);
    })
    .then(() => {
      console.log('Deployed Interactive Part D');
    });
};
