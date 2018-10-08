const ContractResolver = artifacts.require('ContractResolver.sol');

const Dao = artifacts.require('Dao.sol');
const DaoSpecialProposal = artifacts.require('DaoSpecialProposal.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.deploy(Dao, ContractResolver.address)
    .then(() => {
      return deployer.deploy(DaoSpecialProposal, ContractResolver.address);
    })
    .then(() => {
      console.log('Deployed Interactive Part B');
    });
};
