const ContractResolver = artifacts.require('ContractResolver.sol');

const DaoStakeLocking = artifacts.require('DaoStakeLocking.sol');
const DaoIdentity = artifacts.require('DaoIdentity.sol');
const DaoFundingManager = artifacts.require('DaoFundingManager.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.deploy(
    DaoStakeLocking,
    ContractResolver.address,
    process.env.DGD,
    process.env.DGD_BADGE,
    process.env.CV_1,
    process.env.CV_2,
  )
    .then(() => {
      return deployer.deploy(DaoFundingManager, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoIdentity, ContractResolver.address);
    })
    .then(() => {
      console.log('Deployed Interactive Part A');
    });
};
