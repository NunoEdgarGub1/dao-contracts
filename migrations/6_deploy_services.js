const ContractResolver = artifacts.require('ContractResolver.sol');

const DaoListingService = artifacts.require('DaoListingService.sol');
const DaoCalculatorService = artifacts.require('DaoCalculatorService.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.deploy(DaoListingService, ContractResolver.address)
    .then(() => {
      return deployer.deploy(DaoCalculatorService, ContractResolver.address, process.env.DGX_DEMURRAGE_REPORTER);
    })
    .then(() => {
      console.log('Deployed Services');
    });
};
