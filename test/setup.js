const a = require('awaiting');

const {
  indexRange,
  randomBigNumber,
  getCurrentTimestamp,
  randomBytes32,
} = require('@digix/helpers/lib/helpers');

const {
  sampleStakeWeights,
  sampleBadgeWeights,
  daoConstantsKeys,
  phases,
  assertQuarter,
  getTimeToNextPhase,
  getPhase,
} = require('./daoHelpers');

const web3Utils = require('web3-utils');

const randomBigNumbers = function (bN, count, range) {
  return indexRange(0, count).map(() => randomBigNumber(bN, range));
};

const ContractResolver = process.env.SIMULATION ? 0 : artifacts.require('./ContractResolver.sol');
const DoublyLinkedList = process.env.SIMULATION ? 0 : artifacts.require('./DoublyLinkedList.sol');

const DaoIdentityStorage = process.env.SIMULATION ? 0 : artifacts.require('./DaoIdentityStorage.sol');
const DaoConfigsStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoConfigsStorage.sol');
const DaoStakeStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoStakeStorage.sol');
const DaoPointsStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoPointsStorage.sol');
const DaoStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoStorage.sol');
const DaoWhitelistingStorage = process.env.SIMULATION ? 0 : artifacts.require('./DaoWhitelistingStorage.sol');
const IntermediateResultsStorage = process.env.SIMULATION ? 0 : artifacts.require('./IntermediateResultsStorage.sol');

const DaoStructs = process.env.SIMULATION ? 0 : artifacts.require('./DaoStructs.sol');
const DaoUpgradeStorage = process.env.SIMULATION ? 0 : artifacts.require('./DaoUpgradeStorage.sol');
const DaoSpecialStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoSpecialStorage.sol');
const DaoFundingStorage = process.env.SIMULATION ? 0 : artifacts.require('./DaoFundingStorage.sol');
const DaoRewardsStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoRewardsStorage.sol');

const DaoListingService = process.env.SIMULATION ? 0 : artifacts.require('./DaoListingService.sol');
const DaoCalculatorService = process.env.SIMULATION ? 0 : artifacts.require('./DaoCalculatorService.sol');

const DaoIdentity = process.env.SIMULATION ? 0 : artifacts.require('./DaoIdentity.sol');
const Dao = process.env.SIMULATION ? 0 : artifacts.require('./Dao.sol');
const DaoVoting = process.env.SIMULATION ? 0 : artifacts.require('./DaoVoting.sol');
const DaoVotingClaims = process.env.SIMULATION ? 0 : artifacts.require('./MockDaoVotingClaims.sol');
const DaoSpecialVotingClaims = process.env.SIMULATION ? 0 : artifacts.require('./DaoSpecialVotingClaims.sol');
const DaoStakeLocking = process.env.SIMULATION ? 0 : artifacts.require('./DaoStakeLocking.sol');
const DaoFundingManager = process.env.SIMULATION ? 0 : artifacts.require('./DaoFundingManager.sol');
const DaoRewardsManager = process.env.SIMULATION ? 0 : artifacts.require('./DaoRewardsManager.sol');
const DaoWhitelisting = process.env.SIMULATION ? 0 : artifacts.require('./DaoWhitelisting.sol');

const MockDgd = process.env.SIMULATION ? 0 : artifacts.require('./MockDgd.sol');
const MockBadge = process.env.SIMULATION ? 0 : artifacts.require('./MockBadge.sol');
const MockDgxDemurrageReporter = process.env.SIMULATION ? 0 : artifacts.require('./MockDgxDemurrageReporter.sol');
const MockDgx = process.env.SIMULATION ? 0 : artifacts.require('./MockDgx.sol');
const MockDgxStorage = process.env.SIMULATION ? 0 : artifacts.require('./MockDgxStorage.sol');
const MockNumberCarbonVoting1 = process.env.SIMULATION ? 0 : artifacts.require('./NumberCarbonVoting1.sol');
const MockNumberCarbonVoting2 = process.env.SIMULATION ? 0 : artifacts.require('./NumberCarbonVoting2.sol');

const BADGE_HOLDER_COUNT = 4;
const DGD_HOLDER_COUNT = 6;

// Deploy library contracts
const deployLibraries = async function (libs) {
  libs.doublyLinkedList = await DoublyLinkedList.new();
  await DaoStructs.link('DoublyLinkedList', libs.doublyLinkedList.address);
  libs.daoStructs = await DaoStructs.new();
  return libs;
};

// Deploy new Contract Resolver for the DigixDAO contracts
const deployNewContractResolver = async function (contracts) {
  contracts.resolver = await ContractResolver.new();
};

// Returns the `addressOf` object, addresses of all important roles
// in the DigixDAO test scenario
const getAccountsAndAddressOf = function (accounts, addressOf) {
  const addressOfTemp = {
    root: accounts[0],
    prl: accounts[1],
    kycadmin: accounts[2],
    founderBadgeHolder: accounts[3],
    badgeHolders: indexRange(4, 4 + BADGE_HOLDER_COUNT).map(id => accounts[id]), // accounts[4] to accounts[7]
    dgdHolders: indexRange(4 + BADGE_HOLDER_COUNT, 4 + BADGE_HOLDER_COUNT + DGD_HOLDER_COUNT).map(id => accounts[id]), // accounts[8] to accounts[13]
    allParticipants: indexRange(4, 4 + BADGE_HOLDER_COUNT + DGD_HOLDER_COUNT).map(id => accounts[id]), // accounts[4] to accounts[13]
    multiSigUsers: indexRange(16, 19).map(id => accounts[id]), // accounts[16], accounts[17] and accounts[18]
  };
  for (const key in addressOfTemp) addressOf[key] = addressOfTemp[key];
};

const printProposalDetails = async (contracts, proposal, votingRound = 0) => {
  console.log('\tPrinting details for proposal ', proposal.id);
  const proposalDetails = await contracts.daoStorage.readProposal(proposal.id);
  console.log('\t\tProposer: ', proposalDetails[1]);
  console.log('\t\tEndorser: ', proposalDetails[2]);
  console.log('\t\tState: ', proposalDetails[3]);
  console.log('\t\tnVersions: ', proposalDetails[5]);
  console.log('\t\tlatestVersionDoc: ', proposalDetails[6]);
  console.log('\t\tfinalVersion: ', proposalDetails[7]);
  console.log('\t\tVoting round ', votingRound);
  console.log('\t\t\tVoting time start :', await contracts.daoStorage.readProposalVotingTime(proposal.id, votingRound));
};

// Returns list of addresses of all participants
// addressOf.badgeHolders and addressOf.dgdHolders
const getAllParticipantAddresses = function (accounts) {
  const addresses = [];
  for (const i of indexRange(3, 14)) {
    addresses.push(accounts[i]);
  }
  return addresses;
};

// Deploy storage layer contracts
const deployStorage = async function (libs, contracts, resolver) {
  DaoIdentityStorage.link('DoublyLinkedList', libs.doublyLinkedList.address);
  contracts.daoWhitelistingStorage = await DaoWhitelistingStorage.new(resolver.address);
  contracts.daoIdentityStorage = await DaoIdentityStorage.new(resolver.address);
  contracts.daoConfigsStorage = await DaoConfigsStorage.new(resolver.address);
  DaoStakeStorage.link('DoublyLinkedList', libs.doublyLinkedList.address);
  contracts.daoStakeStorage = await DaoStakeStorage.new(resolver.address);
  contracts.daoPointsStorage = await DaoPointsStorage.new(resolver.address);
  DaoStorage.link('DoublyLinkedList', libs.doublyLinkedList.address);
  DaoStorage.link('DaoStructs', libs.daoStructs.address);
  DaoSpecialStorage.link('DoublyLinkedList', libs.doublyLinkedList.address);
  DaoSpecialStorage.link('DaoStructs', libs.daoStructs.address);
  contracts.daoUpgradeStorage = await DaoUpgradeStorage.new(resolver.address);
  contracts.daoStorage = await DaoStorage.new(resolver.address);
  contracts.daoSpecialStorage = await DaoSpecialStorage.new(resolver.address);
  contracts.daoFundingStorage = await DaoFundingStorage.new(resolver.address);
  contracts.daoRewardsStorage = await DaoRewardsStorage.new(resolver.address);
  contracts.intermediateResultsStorage = await IntermediateResultsStorage.new(resolver.address);
};

// This is done only in case of testing the storage layer
// where the calling contract needs to be tested for
// registering the interactive contracts as accounts[0]
// we can then get to call storage functions from accounts[0]
const registerInteractive = async function (resolver, addressOf) {
  const callingKeys = [
    'dao:identity',
    'dao:stake-locking',
    'dao',
    'dao:voting',
    'dao:voting:claims',
    'dao:svoting:claims',
    'dao:funding-manager',
    'dao:rewards-manager',
    'dao:whitelisting',
  ];
  await a.map(callingKeys, 10, key => resolver.register_contract(key, addressOf.root));
};

// Deploy service layer contracts
const deployServices = async function (libs, contracts, resolver) {
  contracts.daoListingService = await DaoListingService.new(resolver.address);
  contracts.daoCalculatorService = await DaoCalculatorService.new(resolver.address, contracts.dgxDemurrageReporter.address);
};

// Deploy the interactive contracts
const deployInteractive = async function (libs, contracts, resolver) {
  contracts.daoStakeLocking = await DaoStakeLocking.new(
    resolver.address,
    contracts.dgdToken.address,
    contracts.badgeToken.address,
    contracts.carbonVoting1.address,
    contracts.carbonVoting2.address,
  );
  contracts.daoIdentity = await DaoIdentity.new(resolver.address);
  contracts.daoFundingManager = await DaoFundingManager.new(resolver.address);
  contracts.dao = await Dao.new(resolver.address);
  contracts.daoVoting = await DaoVoting.new(resolver.address);
  contracts.daoVotingClaims = await DaoVotingClaims.new(resolver.address);
  contracts.daoSpecialVotingClaims = await DaoSpecialVotingClaims.new(resolver.address);
  contracts.daoRewardsManager = await DaoRewardsManager.new(resolver.address, contracts.dgxToken.address);
  contracts.daoWhitelisting = await DaoWhitelisting.new(resolver.address, [
    contracts.daoStakeLocking.address,
    contracts.daoIdentity.address,
    contracts.daoFundingManager.address,
    contracts.dao.address,
    contracts.daoVoting.address,
    contracts.daoVotingClaims.address,
    contracts.daoSpecialVotingClaims.address,
    contracts.daoCalculatorService.address,
    contracts.daoListingService.address,
  ]);
};

// Function to transfer some DGD and DGD badges to the dummy participant accounts
// This is like bootstrapping their accounts with an amount of tokens
const initialTransferTokens = async function (contracts, addressOf, bN) {
  await a.map(indexRange(0, DGD_HOLDER_COUNT + BADGE_HOLDER_COUNT), 20, async (index) => {
    await contracts.dgdToken.transfer(addressOf.allParticipants[index], sampleStakeWeights(bN)[index]);
  });

  await a.map(indexRange(0, BADGE_HOLDER_COUNT), 20, async (index) => {
    await contracts.badgeToken.transfer(addressOf.badgeHolders[index], sampleBadgeWeights(bN)[index]);
  });
};

// Javascript object to maintain proposal params and details
// This is designed to be similar to the Struct in the smart contracts
// This function is called by the `getTestProposals` function
const getProposalStruct = function (bN, proposer, endorser, versions, generateRandom = false) {
  if (generateRandom) {
    versions = [];
    for (let i = 0; i < 3; i++) {
      versions.push({
        versionId: randomBytes32(),
        milestoneCount: 3,
        milestoneFundings: randomBigNumbers(bN, 3, 20),
        milestoneDurations: randomBigNumbers(bN, 3, 1000),
        finalReward: randomBigNumber(bN, 20),
      });
    }
  }
  return {
    id: versions[0].versionId,
    proposer,
    endorser,
    versions,
  };
};

// Test scenario structs for proposals
const getTestProposals = function (bN, addressOf) {
  return [
    getProposalStruct(
      bN,
      addressOf.dgdHolders[0],
      addressOf.badgeHolders[0],
      [{
        versionId: randomBytes32(),
        milestoneCount: 3,
        milestoneFundings: [bN(2 * (10 ** 18)), bN(3 * (10 ** 18))],
        milestoneDurations: [bN(1000), bN(1500)],
        finalReward: bN(1 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 3,
        milestoneFundings: [bN(2 * (10 ** 18)), bN(4 * (10 ** 18))],
        milestoneDurations: [bN(15), bN(30)],
        finalReward: bN(1 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 3,
        milestoneFundings: [bN(2 * (10 ** 18)), bN(4 * (10 ** 18))],
        milestoneDurations: [bN(1000), bN(1500)],
        finalReward: bN(1 * (10 ** 18)),
      }],
    ),

    getProposalStruct(
      bN,
      addressOf.dgdHolders[1],
      addressOf.badgeHolders[1],
      [{
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(5 * (10 ** 18)), bN(7 * (10 ** 18))],
        milestoneDurations: [bN(500), bN(730)],
        finalReward: bN(1 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(6 * (10 ** 18)), bN(7 * (10 ** 18))],
        milestoneDurations: [bN(20), bN(20)],
        finalReward: bN(1 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(5 * (10 ** 18)), bN(8 * (10 ** 18))],
        milestoneDurations: [bN(500), bN(700)],
        finalReward: bN(2 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(5 * (10 ** 18)), bN(7 * (10 ** 18))],
        milestoneDurations: [bN(500), bN(700)],
        finalReward: bN(1 * (10 ** 18)),
      }],
    ),

    getProposalStruct(
      bN,
      addressOf.dgdHolders[1],
      addressOf.badgeHolders[0],
      [{
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(2 * (10 ** 18)), bN(5 * (10 ** 18))],
        milestoneDurations: [bN(2000), bN(3000)],
        finalReward: bN(1 * (10 ** 18)),
      }, {
        versionId: randomBytes32(),
        milestoneCount: 2,
        milestoneFundings: [bN(5 * (10 ** 18)), bN(2 * (10 ** 18))],
        milestoneDurations: [bN(10), bN(10)],
        finalReward: bN(1 * (10 ** 18)),
      }],
    ),

    getProposalStruct(
      bN,
      addressOf.dgdHolders[0],
      addressOf.badgeHolders[1],
      [{
        versionId: randomBytes32(),
        milestoneCount: 4,
        milestoneFundings: [bN(5 * (10 ** 18))],
        milestoneDurations: [bN(25)],
        finalReward: bN(1 * (10 ** 18)),
      }],
    ),
  ];
};

// Assigns true votes, salts and corresponding commits
// This is used during any test/simulating voting round
const assignVotesAndCommits = function (addressOf, proposalCount = 4, voterCount = BADGE_HOLDER_COUNT + DGD_HOLDER_COUNT, voterAddresses = null) {
  if (!voterAddresses) voterAddresses = addressOf.allParticipants;

  const salts = indexRange(0, proposalCount).map(() => indexRange(0, voterCount).map(() => randomBytes32()));
  // salts[proposalIndex][participantIndex] = salt

  const votes = indexRange(0, proposalCount).map(() => indexRange(0, voterCount).map(() => true));
  // votes[proposalIndex][holderIndex] = true/false

  const votingCommits = indexRange(0, proposalCount).map(proposalIndex => indexRange(0, voterCount).map(holderIndex => web3Utils.soliditySha3(
    { t: 'address', v: voterAddresses[holderIndex] },
    { t: 'bool', v: votes[proposalIndex][holderIndex] },
    { t: 'bytes32', v: salts[proposalIndex][holderIndex] },
  )));
  // votingCommits[proposalIndex][holderIndex] contains the commit
  return { salts, votes, votingCommits };
};

// We set a dummy config for DigixDAO for the tests
// Basically, changing the time scale to something more feasible for the test suite
const setDummyConfig = async function (contracts, bN) {
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_LOCKING_PHASE_DURATION, bN(10));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_QUARTER_DURATION, bN(60));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_VOTING_COMMIT_PHASE, bN(10));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_VOTING_PHASE_TOTAL, bN(20));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_INTERIM_COMMIT_PHASE, bN(10));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_INTERIM_PHASE_TOTAL, bN(20));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_SPECIAL_PROPOSAL_COMMIT_PHASE, bN(10));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_SPECIAL_PROPOSAL_PHASE_TOTAL, bN(20));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_DRAFT_VOTING_PHASE, bN(5));
  await contracts.daoConfigsStorage.mock_set_uint_config(daoConstantsKeys().CONFIG_VOTE_CLAIMING_DEADLINE, bN(5));
};

// Initialise DigixDAO
// This function adds members (PRL, Founder and KYC Admin) to their respective groups
// This function sends some Ethers into the DaoFundingManager contract
// This function sets the start of the first quarter (marking the start of DigixDAO)
const initDao = async function (contracts, addressOf, bN, web3) {
  await contracts.daoIdentity.addGroupUser(bN(2), addressOf.founderBadgeHolder, '', { from: addressOf.root });
  await contracts.daoIdentity.addGroupUser(bN(3), addressOf.prl, '', { from: addressOf.root });
  await contracts.daoIdentity.addGroupUser(bN(4), addressOf.kycadmin, '', { from: addressOf.root });
  await contracts.dao.setStartOfFirstQuarter(getCurrentTimestamp(), { from: addressOf.founderBadgeHolder });
  await web3.eth.sendTransaction({
    from: addressOf.root,
    to: contracts.daoFundingManager.address,
    value: web3.toWei(1000, 'ether'),
  });
};

// Function to wait for some timeToWait seconds
// This will send some tiny dummyu transactions from A to B to spend time and return
const waitFor = async function (timeToWait, addressOf, web3) {
  const timeThen = getCurrentTimestamp();
  async function wait() {
    await web3.eth.sendTransaction({ from: addressOf.root, to: addressOf.prl, value: web3.toWei(0.0001, 'ether') });
    if ((getCurrentTimestamp() - timeThen) > timeToWait) return;
    await wait();
  }
  await wait();
};

/**
 * Wait for time to pass, end in the phaseToEndIn phase
 * @param phaseToEndIn   : The phase in which to land (phases.LOCKING_PHASE or phases.MAIN_PHASE)
 * @param quarterToEndIn : The quarter in which to land (quarter.QUARTER_1 or phases.QUARTER_2)
 */
const phaseCorrection = async function (web3, contracts, addressOf, phaseToEndIn, quarterToEndIn) {
  const startOfDao = await contracts.daoUpgradeStorage.startOfFirstQuarter.call();
  const lockingPhaseDuration = await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_LOCKING_PHASE_DURATION);
  const quarterDuration = await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_QUARTER_DURATION);
  const currentPhase = getPhase(
    getCurrentTimestamp(),
    startOfDao.toNumber(),
    lockingPhaseDuration.toNumber(),
    quarterDuration.toNumber(),
  );
  if (currentPhase !== phaseToEndIn) {
    const timeToNextPhase = getTimeToNextPhase(
      getCurrentTimestamp(),
      startOfDao.toNumber(),
      lockingPhaseDuration.toNumber(),
      quarterDuration.toNumber(),
    );
    console.log('\t\twaiting for next phase...');
    await waitFor(timeToNextPhase, addressOf, web3);
    if (quarterToEndIn !== undefined) {
      assertQuarter(
        getCurrentTimestamp(),
        startOfDao.toNumber(),
        lockingPhaseDuration.toNumber(),
        quarterDuration.toNumber(),
        quarterToEndIn,
      );
    }
  }
};

// Reads the start time of the voting round
// calculates the time to wait for the reveal phase, and spends that much time
// before returning
const waitForRevealPhase = async function (contracts, addressOf, proposalId, index, bN, web3) {
  const votingStartTime = await contracts.daoStorage.readProposalVotingTime.call(proposalId, index);
  let timeToWaitFor;
  if (index === bN(0)) {
    timeToWaitFor = (await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_VOTING_COMMIT_PHASE)).toNumber() - (getCurrentTimestamp() - votingStartTime.toNumber());
  } else {
    timeToWaitFor = (await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_INTERIM_COMMIT_PHASE)).toNumber() - (getCurrentTimestamp() - votingStartTime.toNumber());
  }
  console.log('will wait for ', timeToWaitFor, ' seconds');
  await waitFor(timeToWaitFor, addressOf, web3);
};

// Reads the start time of a voting round
// spends time waiting for the reveal phase to get over
// before returning
const waitForRevealPhaseToGetOver = async function (contracts, addressOf, proposalId, index, bN, web3) {
  const votingStartTime = await contracts.daoStorage.readProposalVotingTime.call(proposalId, index);
  let timeToWaitFor;
  if (index === bN(0)) {
    timeToWaitFor = (await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_VOTING_PHASE_TOTAL)).toNumber() - (getCurrentTimestamp() - votingStartTime.toNumber());
  } else {
    timeToWaitFor = (await contracts.daoConfigsStorage.uintConfigs.call(daoConstantsKeys().CONFIG_INTERIM_PHASE_TOTAL)).toNumber() - (getCurrentTimestamp() - votingStartTime.toNumber());
  }
  console.log('will wait for ', timeToWaitFor, ' seconds');
  await waitFor(timeToWaitFor, addressOf, web3);
};

// Function to deploy a fresh DigixDAO
// Deploys all contracts, dummy token contracts
// Also initializes DigixDAO (set the start time of the first quarter)
// Sets dummy config for DigixDAO
// Funds the DaoFundingManager contract with some ether to start with
const deployFreshDao = async (libs, contracts, addressOf, accounts, bN, web3) => {
  await deployLibraries(libs);
  await deployNewContractResolver(contracts);
  await getAccountsAndAddressOf(accounts, addressOf);
  contracts.dgdToken = await MockDgd.new();
  contracts.badgeToken = await MockBadge.new();
  contracts.dgxStorage = await MockDgxStorage.new();
  contracts.dgxToken = await MockDgx.new(contracts.dgxStorage.address, addressOf.feesadmin);
  await contracts.dgxStorage.setInteractive(contracts.dgxToken.address);
  contracts.dgxDemurrageReporter = await MockDgxDemurrageReporter.new(contracts.dgxToken.address);
  contracts.carbonVoting1 = await MockNumberCarbonVoting1.new('carbonVoting1');
  contracts.carbonVoting2 = await MockNumberCarbonVoting2.new('carbonVoting2');
  await deployStorage(libs, contracts, contracts.resolver);
  await deployServices(libs, contracts, contracts.resolver);
  await deployInteractive(libs, contracts, contracts.resolver);
  await contracts.daoIdentity.addGroupUser(bN(2), addressOf.founderBadgeHolder, '');
  await contracts.dao.setStartOfFirstQuarter(getCurrentTimestamp(), { from: addressOf.founderBadgeHolder });
  await setDummyConfig(contracts, bN);
  await fundDao(web3, accounts, contracts);
  console.log('\tDeployed fresh DAO');
};

// Function to transfer ether to the DaoFundingManager contract
const fundDao = async function (web3, accounts, contracts) {
  await web3.eth.sendTransaction({
    from: accounts[0],
    to: contracts.daoFundingManager.address,
    value: web3.toWei(1000, 'ether'),
  });
};

const printParticipantDetails = async (bN, contracts, address) => {
  console.log('Printing details for ', address);
  console.log('\tPoints: ', address);
  console.log('\t\tQP = ', await contracts.daoPointsStorage.getQuarterPoint.call(address, bN(1)));
  console.log('\t\tModerator QP = ', await contracts.daoPointsStorage.getQuarterModeratorPoint.call(address, bN(1)));
  console.log('\t\tRP = ', await contracts.daoPointsStorage.getReputation.call(address));
  console.log('\tStake: ');
  console.log('\t\tActual locked DGDs: ', await contracts.daoStakeStorage.actualLockedDGD.call(address));
  console.log('\t\tLocked DGD Stake: ', await contracts.daoStakeStorage.lockedDGDStake.call(address));
  console.log('\tRewards: ');
  console.log('\t\tClaimable DGX  = ', await contracts.daoRewardsStorage.claimableDGXs.call(address));
  console.log('\t\tLast participated quarter = ', await contracts.daoRewardsStorage.lastParticipatedQuarter.call(address));
  console.log('\t\tlastQuarterThatRewardsWasUpdated = ', await contracts.daoRewardsStorage.lastQuarterThatRewardsWasUpdated.call(address));
  console.log('\t\tlastQuarterThatReputationWasUpdated = ', await contracts.daoRewardsStorage.lastQuarterThatReputationWasUpdated.call(address));
  console.log();
};

const printDaoDetails = async (bN, contracts) => {
  console.log('Printing DAO details');
  const qIndex = await contracts.dao.currentQuarterIndex.call();
  console.log('\tCurrent Quarter: ', qIndex);
  console.log('\tDGX distribution day: ', await contracts.daoRewardsStorage.readDgxDistributionDay.call(qIndex));
  console.log('\tDGX distribution day last quarter: ', await contracts.daoRewardsStorage.readDgxDistributionDay.call(qIndex.minus(1)));
  console.log('\tDGX distribution day last last quarter: ', await contracts.daoRewardsStorage.readDgxDistributionDay.call(qIndex.minus(2)));
  // TODO: print more stuff
};

// Function to withdraw tokens from `participants`
// This can only be called in the Locking Phase
// Its usually called at the end of the test case
// so that tokens go back to the accounts of the participants
// before a new set of contracts are deployed
const withdrawDGDs = async (web3, contracts, bN, participants) => {
  for (const participant of participants) {
    console.log('\nAbout to withdraw DGD for ', participant.address);
    await printParticipantDetails(bN, contracts, participant.address);
  }
  await a.map(participants, 20, async (participant) => {
    await contracts.daoStakeLocking.withdrawDGD(participant.dgdToLock, { from: participant.address });
  });
};

// Function to lock DGD tokens into the DaoStakeLocking contract
// This will enable the `participants` to be participants/moderators of DigixDAO
const lockDGDs = async (web3, contracts, bN, participants, addressOf) => {
  await a.map(participants, 20, async (participant) => {
    await contracts.daoStakeLocking.lockDGD(participant.dgdToLock, { from: participant.address });
  });
  await contracts.daoStakeLocking.lockDGD(participants[0].dgdToLock, { from: addressOf.founderBadgeHolder });
};

// Function to redeem a DGD Badge for reputation points by `participants`
const redeemBadges = async (web3, contracts, bN, participants) => {
  await a.map(participants, 20, async (participant) => {
    if (participant.redeemingBadge) {
      await contracts.daoStakeLocking.redeemBadge({ from: participant.address });
    }
  });
};

// Function to transfer tokens (DGD and DGD Badge) to `participants`
// Also these users then approve the DaoStakeLocking contract to access the tokens on their behalf
const fundUserAndApproveForStakeLocking = async (web3, contracts, bN, participants, addressOf) => {
  const ENOUGH_DGD = bN(1000e9);
  const ENOUGH_BADGE = bN(5);
  await a.map(participants, 20, async (participant) => {
    await contracts.dgdToken.transfer(participant.address, ENOUGH_DGD);
    await contracts.badgeToken.transfer(participant.address, ENOUGH_BADGE);
    await contracts.dgdToken.approve(contracts.daoStakeLocking.address, bN(2 ** 255), { from: participant.address });
    await contracts.badgeToken.approve(contracts.daoStakeLocking.address, bN(2 ** 255), { from: participant.address });
  });
  await contracts.dgdToken.transfer(addressOf.founderBadgeHolder, ENOUGH_DGD);
  await contracts.badgeToken.transfer(addressOf.founderBadgeHolder, ENOUGH_BADGE);
  await contracts.dgdToken.approve(contracts.daoStakeLocking.address, bN(2 ** 255), { from: addressOf.founderBadgeHolder });
  await contracts.badgeToken.approve(contracts.daoStakeLocking.address, bN(2 ** 255), { from: addressOf.founderBadgeHolder });
};

// Get a dummy list of participants
const getParticipants = (addressOf, bN) => {
  const participants = [
    {
      address: addressOf.badgeHolders[0],
      dgdToLock: bN(120e9),
      startingReputation: bN(1000),
      quarterPointFirstQuarter: bN(50),
      quarterModeratorPointFirstQuarter: bN(5),
      kycInfo: {
        doc: 'till 2 months',
        expiry: bN(getCurrentTimestamp() + (3600 * 24 * 30 * 2)),
      },
    },
    {
      address: addressOf.badgeHolders[1],
      dgdToLock: bN(110e9),
      startingReputation: bN(800),
      quarterPointFirstQuarter: bN(50),
      quarterModeratorPointFirstQuarter: bN(5),
      kycInfo: {
        doc: 'till 2 months',
        expiry: bN(getCurrentTimestamp() + (3600 * 24 * 30 * 2)),
      },
    },
    {
      address: addressOf.dgdHolders[0],
      dgdToLock: bN(20e9),
      startingReputation: bN(10),
      quarterPointFirstQuarter: bN(30),
      quarterModeratorPointFirstQuarter: bN(0),
      kycInfo: {
        doc: 'till 1 month',
        expiry: bN(getCurrentTimestamp() + (3600 * 24 * 30)),
      },
    },
    {
      address: addressOf.dgdHolders[1],
      dgdToLock: bN(10e9),
      startingReputation: bN(0),
      quarterPointFirstQuarter: bN(20),
      quarterModeratorPointFirstQuarter: bN(0),
      kycInfo: {
        doc: 'till 1 month',
        expiry: bN(getCurrentTimestamp() + (3600 * 24 * 30)),
      },
    },
  ];
  return participants;
};

// Function to update the KYC deadlines for `participants`
// Their respective KYC info is taken from the struct returned by `getParticipants`
const updateKyc = async function (contracts, addressOf, participants) {
  await a.map(participants, 20, async (participant) => {
    await contracts.daoIdentity.updateKyc(
      participant.address,
      participant.kycInfo.doc,
      participant.kycInfo.expiry,
      { from: addressOf.kycadmin },
    );
  });
  await contracts.daoIdentity.updateKyc(
    addressOf.founderBadgeHolder,
    '',
    participants[0].kycInfo.expiry,
    { from: addressOf.kycadmin },
  );
};

// This function will setup the participants state exactly as specified, before the first quarter mainphase starts
const setupParticipantsStates = async (web3, contracts, addressOf, bN, participants) => {
  if (!participants) {
    participants = getParticipants(addressOf, bN);
  }
  await fundUserAndApproveForStakeLocking(web3, contracts, bN, participants, addressOf);
  await a.map(participants, 20, async (participant) => {
    await contracts.daoPointsStorage.setQP(participant.address, participant.quarterPointFirstQuarter, bN(1));
    await contracts.daoPointsStorage.setRP(participant.address, participant.startingReputation);
    await contracts.daoPointsStorage.setModeratorQP(participant.address, participant.quarterModeratorPointFirstQuarter, bN(1));
  });
  await lockDGDs(web3, contracts, bN, participants, addressOf);

  // console.log('\tInitialized participants stakes and points for first quarter, waiting until main phase');
  await phaseCorrection(web3, contracts, addressOf, phases.MAIN_PHASE);
};

// This function adds a proposal as preproposals into DigixDAO
const addProposal = async function (contracts, proposal) {
  console.log('adding proposal ', proposal.id);
  await contracts.dao.submitPreproposal(
    proposal.id,
    proposal.versions[0].milestoneFundings,
    proposal.versions[0].finalReward,
    { from: proposal.proposer, value: 2 * (10 ** 18) },
  );
  console.log('Done adding proposal ', proposal.id);
};

// This function makes a moderator endorse a preproposal
const endorseProposal = async function (contracts, proposal) {
  console.log('endorsing proposal ', proposal.id);
  await contracts.dao.endorseProposal(proposal.id, { from: proposal.endorser });
};

// Function to modify a proposal
// Basically add a `nextVersion` to the existing proposal
// This can only be done before the proposal is finalized
const modifyProposal = async function (contracts, proposal, nextVersion) {
  await contracts.dao.modifyProposal(
    proposal.id,
    proposal.versions[nextVersion].versionId,
    proposal.versions[nextVersion].milestoneFundings,
    proposal.versions[nextVersion].finalReward,
    { from: proposal.proposer },
  );
};

module.exports = {
  addProposal,
  endorseProposal,
  deployLibraries,
  deployNewContractResolver,
  getAccountsAndAddressOf,
  getAllParticipantAddresses,
  deployStorage,
  registerInteractive,
  deployServices,
  deployInteractive,
  initialTransferTokens,
  waitFor,
  waitForRevealPhase,
  waitForRevealPhaseToGetOver,
  getTestProposals,
  phaseCorrection,
  modifyProposal,
  setupParticipantsStates,
  initDao,
  redeemBadges,
  fundUserAndApproveForStakeLocking,
  lockDGDs,
  getParticipants,
  withdrawDGDs,
  assignVotesAndCommits,
  setDummyConfig,
  deployFreshDao,
  printProposalDetails,
  updateKyc,
  printDaoDetails,
  printParticipantDetails,
  BADGE_HOLDER_COUNT,
  DGD_HOLDER_COUNT,
};
