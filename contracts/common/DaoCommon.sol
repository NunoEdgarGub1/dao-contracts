pragma solidity ^0.4.24;

import "../service/DaoListingService.sol";
import "./DaoConstants.sol";
import "./IdentityCommon.sol";
import "../storage/DaoConfigsStorage.sol";
import "../storage/DaoStakeStorage.sol";
import "../storage/DaoStorage.sol";
import "../storage/DaoUpgradeStorage.sol";
import "../storage/DaoSpecialStorage.sol";
import "../storage/DaoPointsStorage.sol";
import "../storage/DaoFundingStorage.sol";
import "../storage/DaoRewardsStorage.sol";
import "../storage/DaoWhitelistingStorage.sol";
import "../storage/IntermediateResultsStorage.sol";
import "../lib/MathHelper.sol";

contract DaoCommon is IdentityCommon {

    using MathHelper for MathHelper;

    //almostdone
    /**
    @notice Check if the DAO contracts have been replaced by a new set of contracts
    @return _isReplaced true if it is already replaced
    */
    function isDaoNotReplaced()
        internal
        constant
        returns (bool _isNotReplaced)
    {
        _isNotReplaced = !daoUpgradeStorage().isReplacedByNewDao();
    }

    //done
    /**
    @notice Check if it is currently in the locking phase
    @dev No governance activities can happen in the locking phase. The locking phase is from t=0 to t=CONFIG_LOCKING_PHASE_DURATION-1
    @return _isLockingPhase true if it is in the locking phase
    */
    function isLockingPhase()
        internal
        constant
        returns (bool _isLockingPhase)
    {
        _isLockingPhase = currentTimeInQuarter() < getUintConfig(CONFIG_LOCKING_PHASE_DURATION);
    }

    //done
    /**
    @notice Check if it is currently in a main phase.
    @dev The main phase is where all the governance activities could take plase. If the DAO is replaced, there can never be any more main phase.
    @return _isMainPhase true if it is in a main phase
    */
    function isMainPhase()
        internal
        constant
        returns (bool _isMainPhase)
    {
        _isMainPhase =
            isDaoNotReplaced() &&
            currentTimeInQuarter() >= getUintConfig(CONFIG_LOCKING_PHASE_DURATION);
    }

    //done
    /**
    @notice Check if a proposal is currently paused/stopped
    @dev If a proposal is paused/stopped (by the PRLs): proposer cannot call for voting, a current on-going voting round can still pass, but no funding can be withdrawn.
    @dev A paused proposal can still be unpaused
    @dev If a proposal is stopped, this function also returns true
    @return _isPausedOrStopped true if the proposal is paused(or stopped)
    */
    function isProposalPaused(bytes32 _proposalId)
        public
        constant
        returns (bool _isPausedOrStopped)
    {
        (,,,,,,,,_isPausedOrStopped,) = daoStorage().readProposal(_proposalId);
    }

    //done
    /**
    @notice Check if the transaction is called by the proposer of a proposal
    @return _isFromProposer true if the caller is the proposer
    */
    function isFromProposer(bytes32 _proposalId)
        internal
        constant
        returns (bool _isFromProposer)
    {
        _isFromProposer = msg.sender == daoStorage().readProposalProposer(_proposalId);
    }

    //done
    /**
    @notice Check if the proposal can still be "editted", or in other words, added more versions
    @dev Once the proposal is finalized, it can no longer be editted. The proposer will still be able to add docs and change fundings though.
    @return _isEditable true if the proposal is editable
    */
    function isEditable(bytes32 _proposalId)
        internal
        constant
        returns (bool _isEditable)
    {
        bytes32 _finalVersion;
        (,,,,,,,_finalVersion,,) = daoStorage().readProposal(_proposalId);
        _isEditable = _finalVersion == EMPTY_BYTES;
    }

    //done
    /**
    @notice Check if it is after the draft voting phase of the proposal
    */
    modifier ifAfterDraftVotingPhase(bytes32 _proposalId) {
        uint256 _start = daoStorage().readProposalDraftVotingTime(_proposalId);
        require(_start > 0); // Draft voting must have started. In other words, proposer must have finalized the proposal
        require(now >= _start + getUintConfig(CONFIG_DRAFT_VOTING_PHASE));
        _;
    }

    //done
    modifier ifCommitPhase(bytes32 _proposalId, uint8 _index) {
        requireInPhase(
            daoStorage().readProposalVotingTime(_proposalId, _index),
            0,
            getUintConfig(_index == 0 ? CONFIG_VOTING_COMMIT_PHASE : CONFIG_INTERIM_COMMIT_PHASE)
        );
        _;
    }

    //done
    modifier ifRevealPhase(bytes32 _proposalId, uint256 _index) {
      requireInPhase(
          daoStorage().readProposalVotingTime(_proposalId, _index),
          getUintConfig(_index == 0 ? CONFIG_VOTING_COMMIT_PHASE : CONFIG_INTERIM_COMMIT_PHASE),
          getUintConfig(_index == 0 ? CONFIG_VOTING_PHASE_TOTAL : CONFIG_INTERIM_PHASE_TOTAL)
      );
      _;
    }

    //done
    modifier ifAfterProposalRevealPhase(bytes32 _proposalId, uint256 _index) {
      uint256 _start = daoStorage().readProposalVotingTime(_proposalId, _index);
      require(_start > 0);
      require(now >= _start.add(getUintConfig(_index == 0 ? CONFIG_VOTING_PHASE_TOTAL : CONFIG_INTERIM_PHASE_TOTAL)));
      _;
    }

    //done
    modifier ifDraftVotingPhase(bytes32 _proposalId) {
        requireInPhase(
            daoStorage().readProposalDraftVotingTime(_proposalId),
            0,
            getUintConfig(CONFIG_DRAFT_VOTING_PHASE)
        );
        _;
    }

    //done
    modifier isProposalState(bytes32 _proposalId, bytes32 _STATE) {
        bytes32 _currentState;
        (,,,_currentState,,,,,,) = daoStorage().readProposal(_proposalId);
        require(_currentState == _STATE);
        _;
    }

    //done
    /**
    @notice Check if the DAO has enough ETHs for a particular funding request
    */
    modifier ifFundingPossible(uint256[] _fundings, uint256 _finalReward) {
        require(MathHelper.sumNumbers(_fundings).add(_finalReward) <= daoFundingStorage().ethInDao());
        _;
    }

    //done
    modifier ifDraftNotClaimed(bytes32 _proposalId) {
        require(daoStorage().isDraftClaimed(_proposalId) == false);
        _;
    }

    //done
    modifier ifNotClaimed(bytes32 _proposalId, uint256 _index) {
        require(daoStorage().isClaimed(_proposalId, _index) == false);
        _;
    }

    //done
    modifier ifNotClaimedSpecial(bytes32 _proposalId) {
        require(daoSpecialStorage().isClaimed(_proposalId) == false);
        _;
    }

    //done
    modifier hasNotRevealed(bytes32 _proposalId, uint256 _index) {
        uint256 _voteWeight;
        (, _voteWeight) = daoStorage().readVote(_proposalId, _index, msg.sender);
        require(_voteWeight == uint(0));
        _;
    }

    //done
    modifier hasNotRevealedSpecial(bytes32 _proposalId) {
        uint256 _weight;
        (,_weight) = daoSpecialStorage().readVote(_proposalId, msg.sender);
        require(_weight == uint(0));
        _;
    }

    //done
    modifier ifAfterRevealPhaseSpecial(bytes32 _proposalId) {
      uint256 _start = daoSpecialStorage().readVotingTime(_proposalId);
      require(_start > 0);
      require(now.sub(_start) >= getUintConfig(CONFIG_SPECIAL_PROPOSAL_PHASE_TOTAL));
      _;
    }

    //done
    modifier ifCommitPhaseSpecial(bytes32 _proposalId) {
        requireInPhase(
            daoSpecialStorage().readVotingTime(_proposalId),
            0,
            getUintConfig(CONFIG_SPECIAL_PROPOSAL_COMMIT_PHASE)
        );
        _;
    }

    //done
    modifier ifRevealPhaseSpecial(bytes32 _proposalId) {
        requireInPhase(
            daoSpecialStorage().readVotingTime(_proposalId),
            getUintConfig(CONFIG_SPECIAL_PROPOSAL_COMMIT_PHASE),
            getUintConfig(CONFIG_SPECIAL_PROPOSAL_PHASE_TOTAL)
        );
        _;
    }

    //done
    modifier ifNotContract(address _address) {
        uint size;
        assembly {
            size := extcodesize(_address)
        }
        require(size == 0);
        _;
    }

    //done
    /**
    @notice Check if the calculateGlobalRewardsBeforeNewQuarter function has been done for a certain quarter
    @dev However, there is no need to run calculateGlobalRewardsBeforeNewQuarter for the first quarter
    */
    modifier ifGlobalRewardsSet(uint256 _quarterIndex) {
        if (_quarterIndex > 1) {
            require(daoRewardsStorage().readDgxDistributionDay(_quarterIndex) > 0);
        }
        _;
    }

    //done
    /**
    @notice require that it is currently during a phase, which is within _relativePhaseStart and _relativePhaseEnd seconds, after the _startingPoint
    */
    function requireInPhase(uint256 _startingPoint, uint256 _relativePhaseStart, uint256 _relativePhaseEnd)
        internal
        constant
    {
        require(_startingPoint > 0);
        require(now < _startingPoint.add(_relativePhaseEnd));
        require(now >= _startingPoint.add(_relativePhaseStart));
    }

    //done
    /**
    @notice Get the current quarter index
    @dev Quarter indexes starts from 1
    @return _quarterIndex the current quarter index
    */
    function currentQuarterIndex()
        public
        constant
        returns(uint256 _quarterIndex)
    {
        _quarterIndex = getQuarterIndex(now);
        //TODO: the QUARTER DURATION must be a fixed config and cannot be changed
    }

    //done
    /**
    @notice Get the quarter index of a timestamp
    @dev Quarter indexes starts from 1
    @return _index the quarter index
    */
    function getQuarterIndex(uint256 _time)
        internal
        constant
        returns (uint256 _index)
    {
        require(startOfFirstQuarterIsSet());
        _index =
            _time.sub(daoUpgradeStorage().startOfFirstQuarter())
            .div(getUintConfig(CONFIG_QUARTER_DURATION))
            .add(1);
        //TODO: the QUARTER DURATION must be a fixed config and cannot be changed
    }

    //done
    /**
    @notice Get the relative time in quarter of a timestamp
    @dev For example, the timeInQuarter of the first second of any quarter n-th is always 1
    @return _isMainPhase true if it's in a main phase
    */
    function timeInQuarter(uint256 _time)
        internal
        constant
        returns (uint256 _timeInQuarter)
    {
        require(startOfFirstQuarterIsSet()); // must be already set
        _timeInQuarter =
            _time.sub(daoUpgradeStorage().startOfFirstQuarter())
            % getUintConfig(CONFIG_QUARTER_DURATION);
    }

    //done
    /**
    @notice Check if the start of first quarter is already set
    @return _isSet true if start of first quarter is already set
    */
    function startOfFirstQuarterIsSet()
        internal
        constant
        returns (bool _isSet)
    {
        _isSet = daoUpgradeStorage().startOfFirstQuarter() != 0;
    }

    //done
    /**
    @notice Get the current relative time in the quarter
    @dev For example: the currentTimeInQuarter of the first second of any quarter is 1
    @return _currentT the current relative time in the quarter
    */
    function currentTimeInQuarter()
        public
        constant
        returns (uint256 _currentT)
    {
        _currentT = timeInQuarter(now);
    }

    //done
    /**
    @notice Get the time remaining in the quarter
    */
    function getTimeLeftInQuarter(uint256 _time)
        internal
        constant
        returns (uint256 _timeLeftInQuarter)
    {
        _timeLeftInQuarter = getUintConfig(CONFIG_QUARTER_DURATION).sub(timeInQuarter(_time));
        //TODO: the QUARTER DURATION must be a fixed config and cannot be changed
    }

    function daoListingService()
        internal
        constant
        returns (DaoListingService _contract)
    {
        _contract = DaoListingService(get_contract(CONTRACT_SERVICE_DAO_LISTING));
    }

    function daoConfigsStorage()
        internal
        constant
        returns (DaoConfigsStorage _contract)
    {
        _contract = DaoConfigsStorage(get_contract(CONTRACT_STORAGE_DAO_CONFIG));
    }

    function daoStakeStorage()
        internal
        constant
        returns (DaoStakeStorage _contract)
    {
        _contract = DaoStakeStorage(get_contract(CONTRACT_STORAGE_DAO_STAKE));
    }

    function daoStorage()
        internal
        constant
        returns (DaoStorage _contract)
    {
        _contract = DaoStorage(get_contract(CONTRACT_STORAGE_DAO));
    }

    function daoUpgradeStorage()
        internal
        constant
        returns (DaoUpgradeStorage _contract)
    {
        _contract = DaoUpgradeStorage(get_contract(CONTRACT_STORAGE_DAO_UPGRADABLE));
    }

    function daoSpecialStorage()
        internal
        constant
        returns (DaoSpecialStorage _contract)
    {
        _contract = DaoSpecialStorage(get_contract(CONTRACT_STORAGE_DAO_SPECIAL));
    }

    function daoPointsStorage()
        internal
        constant
        returns (DaoPointsStorage _contract)
    {
        _contract = DaoPointsStorage(get_contract(CONTRACT_STORAGE_DAO_POINTS));
    }

    function daoFundingStorage()
        internal
        constant
        returns (DaoFundingStorage _contract)
    {
        _contract = DaoFundingStorage(get_contract(CONTRACT_STORAGE_DAO_FUNDING));
    }

    function daoRewardsStorage()
        internal
        constant
        returns (DaoRewardsStorage _contract)
    {
        _contract = DaoRewardsStorage(get_contract(CONTRACT_STORAGE_DAO_REWARDS));
    }

    function daoWhitelistingStorage()
        internal
        constant
        returns (DaoWhitelistingStorage _contract)
    {
        _contract = DaoWhitelistingStorage(get_contract(CONTRACT_STORAGE_DAO_WHITELISTING));
    }

    function intermediateResultsStorage()
        internal
        constant
        returns (IntermediateResultsStorage _contract)
    {
        _contract = IntermediateResultsStorage(get_contract(CONTRACT_STORAGE_INTERMEDIATE_RESULTS));
    }

    function getUintConfig(bytes32 _configKey)
        public
        constant
        returns (uint256 _configValue)
    {
        _configValue = daoConfigsStorage().uintConfigs(_configKey);
    }

    function get_address_config(bytes32 _configKey)
        public
        constant
        returns (address _configValue)
    {
        _configValue = daoConfigsStorage().addressConfigs(_configKey);
    }

    function get_bytes_config(bytes32 _configKey)
        public
        constant
        returns (bytes32 _configValue)
    {
        _configValue = daoConfigsStorage().bytesConfigs(_configKey);
    }

    function isParticipant(address _user)
        public
        constant
        returns (bool _is)
    {
        if (
            (daoRewardsStorage().lastParticipatedQuarter(_user) == currentQuarterIndex()) &&
            (daoStakeStorage().readUserEffectiveDGDStake(_user) >= getUintConfig(CONFIG_MINIMUM_LOCKED_DGD))
        ) {
            _is = true;
        }
    }

    function isModerator(address _user)
        public
        constant
        returns (bool _is)
    {
        if (
            (daoRewardsStorage().lastParticipatedQuarter(_user) == currentQuarterIndex()) &&
            (daoStakeStorage().readUserEffectiveDGDStake(_user) >= getUintConfig(CONFIG_MINIMUM_DGD_FOR_MODERATOR)) &&
            (daoPointsStorage().getReputation(_user) >= getUintConfig(CONFIG_MINIMUM_REPUTATION_FOR_MODERATOR))
        ) {
            _is = true;
        }
    }

    function startOfMilestone(bytes32 _proposalId, uint256 _milestoneIndex)
        internal
        constant
        returns (uint256 _milestoneStart)
    {
        if (_milestoneIndex == 0) { // This is the 1st milestone, which starts after voting round 0
            _milestoneStart =
                daoStorage().readProposalVotingTime(_proposalId, 0)
                .add(getUintConfig(CONFIG_VOTING_PHASE_TOTAL));
        } else { // if its the n-th milestone, it starts after voting round n-th
            _milestoneStart =
                daoStorage().readProposalVotingTime(_proposalId, _milestoneIndex)
                .add(getUintConfig(CONFIG_INTERIM_PHASE_TOTAL));
        }
    }

    //done
    /**
    @notice Calculate the actual voting start for a voting round, given the tentative start
    @dev The tentative start is the ideal start. For example, when a proposer finish a milestone, it should be now
         However, sometimes the tentative start is too close to the end of the quarter, hence, the actual voting start should be pushed to the next quarter
    */
    function getTimelineForNextVote(
        uint256 _index,
        uint256 _tentativeVotingStart
    )
        internal
        constant
        returns (uint256 _actualVotingStart)
    {
        uint256 _timeLeftInQuarter = getTimeLeftInQuarter(_tentativeVotingStart);
        uint256 _votingDuration = getUintConfig(_index == 0 ? CONFIG_VOTING_PHASE_TOTAL : CONFIG_INTERIM_PHASE_TOTAL);
        _actualVotingStart = _tentativeVotingStart;
        if (timeInQuarter(_tentativeVotingStart) < getUintConfig(CONFIG_LOCKING_PHASE_DURATION)) { // if the tentative start is during a locking phase
            _actualVotingStart = _tentativeVotingStart.add(
                getUintConfig(CONFIG_LOCKING_PHASE_DURATION).sub(timeInQuarter(_tentativeVotingStart))
            );
        } else if (_timeLeftInQuarter < _votingDuration.add(getUintConfig(CONFIG_VOTE_CLAIMING_DEADLINE))) { // if the time left in quarter is not enough to vote and claim voting
            _actualVotingStart = _tentativeVotingStart.add(
                _timeLeftInQuarter.add(getUintConfig(CONFIG_LOCKING_PHASE_DURATION)).add(1)
            );
        }
    }

    function checkNonDigixProposalLimit(bytes32 _proposalId)
        internal
        constant
    {
        bool _isDigixProposal;
        (,,,,,,,,,_isDigixProposal) = daoStorage().readProposal(_proposalId);
        if (!_isDigixProposal) {
            require(daoStorage().proposalCountByQuarter(currentQuarterIndex()) < getUintConfig(CONFIG_PROPOSAL_CAP_PER_QUARTER));
        }
    }

    function checkNonDigixFundings(uint256[] _milestonesFundings, uint256 _finalReward)
        internal
        constant
    {
        if (!is_founder()) {
            require(MathHelper.sumNumbers(_milestonesFundings).add(_finalReward) <= getUintConfig(CONFIG_MAX_FUNDING_FOR_NON_DIGIX));
            require(_milestonesFundings.length <= getUintConfig(CONFIG_MAX_MILESTONES_FOR_NON_DIGIX));
        }
    }

    function senderCanDoProposerOperations()
        internal
        constant
    {
        require(isMainPhase());
        require(isParticipant(msg.sender));
        require(identity_storage().is_kyc_approved(msg.sender));
    }

}
