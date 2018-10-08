const ContractResolver = artifacts.require('ContractResolver.sol');
const DoublyLinkedList = artifacts.require('DoublyLinkedList.sol');
const DaoStructs = artifacts.require('DaoStructs.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.deploy(ContractResolver)
    .then(() => {
      return deployer.deploy(DoublyLinkedList);
    })
    .then(() => {
      return deployer.link(DoublyLinkedList, DaoStructs);
    })
    .then(() => {
      return deployer.deploy(DaoStructs);
    })
    .then(() => {
      console.log('Done Deploying Libraries');
    });
};
