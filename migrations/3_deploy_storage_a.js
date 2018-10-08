const ContractResolver = artifacts.require('ContractResolver.sol');
const DoublyLinkedList = artifacts.require('DoublyLinkedList.sol');

const DaoIdentityStorage = artifacts.require('DaoIdentityStorage.sol');
const DaoConfigsStorage = artifacts.require('MockDaoConfigsStorage.sol');
const DaoPointsStorage = artifacts.require('DaoPointsStorage.sol');
const DaoUpgradeStorage = artifacts.require('DaoUpgradeStorage.sol');

module.exports = async function (deployer, network) {
  if ((network === 'development' && !process.env.FORCE) || process.env.SKIP) { return null; }
  deployer.link(DoublyLinkedList, DaoIdentityStorage)
    .then(() => {
      return deployer.deploy(DaoUpgradeStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoIdentityStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoConfigsStorage, ContractResolver.address);
    })
    .then(() => {
      return deployer.deploy(DaoPointsStorage, ContractResolver.address);
    })
    .then(() => {
      console.log('Deployed Storage Part A');
    });
};
