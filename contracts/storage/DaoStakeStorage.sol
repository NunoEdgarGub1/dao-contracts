pragma solidity ^0.4.24;

import "@digix/solidity-collections/contracts/lib/DoublyLinkedList.sol";
import "@digix/solidity-collections/contracts/abstract/AddressIteratorStorage.sol";
import "@digix/cacp-contracts-dao/contracts/ResolverClient.sol";
import "../common/DaoConstants.sol";

contract DaoStakeStorage is ResolverClient, DaoConstants, AddressIteratorStorage {
    using DoublyLinkedList for DoublyLinkedList.Address;

    // This is the DGD stake of a user (one that is considered in the DAO)
    mapping (address => uint256) public lockedDGDStake;

    // This is the actual number of DGDs locked by user
    // may be more than the lockedDGDStake
    // in case they locked during the main phase
    mapping (address => uint256) public actualLockedDGD;

    // The total locked DGDs in the DAO (summation of lockedDGDStake)
    uint256 public totalLockedDGDStake;

    // The total locked DGDs by moderators
    uint256 public totalModeratorLockedDGDStake;

    // The list of participants in DAO
    // actual participants will be subset of this list
    DoublyLinkedList.Address allParticipants;

    // The list of moderators in DAO
    // actual moderators will be subset of this list
    DoublyLinkedList.Address allModerators;

    // Boolean to mark if an address has redeemed
    // reputation points for their DGD Badge
    mapping (address => bool) public redeemedBadge;

    // mapping to note whether an address has claimed their
    // reputation bonus for carbon vote participation
    mapping (address => bool) public carbonVoteBonusClaimed;

    constructor(address _resolver) public {
        require(init(CONTRACT_STORAGE_DAO_STAKE, _resolver));
    }

    function redeemBadge(address _user)
        public
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        redeemedBadge[_user] = true;
    }

    function setCarbonVoteBonusClaimed(address _user)
        public
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        carbonVoteBonusClaimed[_user] = true;
    }

    function updateTotalLockedDGDStake(uint256 _totalLockedDGDStake)
        public
    {
        require(sender_is_from([CONTRACT_DAO_STAKE_LOCKING, CONTRACT_DAO_REWARDS_MANAGER, EMPTY_BYTES]));
        totalLockedDGDStake = _totalLockedDGDStake;
    }

    function updateTotalModeratorLockedDGDs(uint256 _totalLockedDGDStake)
        public
    {
        require(sender_is_from([CONTRACT_DAO_STAKE_LOCKING, CONTRACT_DAO_REWARDS_MANAGER, EMPTY_BYTES]));
        totalModeratorLockedDGDStake = _totalLockedDGDStake;
    }

    function updateUserDGDStake(address _user, uint256 _actualLockedDGD, uint256 _lockedDGDStake)
        public
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        actualLockedDGD[_user] = _actualLockedDGD;
        lockedDGDStake[_user] = _lockedDGDStake;
    }

    function readUserDGDStake(address _user)
        public
        constant
        returns (
            uint256 _actualLockedDGD,
            uint256 _lockedDGDStake
        )
    {
        _actualLockedDGD = actualLockedDGD[_user];
        _lockedDGDStake = lockedDGDStake[_user];
    }

    function addToParticipantList(address _user)
        public
        returns (bool _success)
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        _success = allParticipants.append(_user);
    }

    function removeFromParticipantList(address _user)
        public
        returns (bool _success)
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        _success = allParticipants.remove_item(_user);
    }

    function addToModeratorList(address _user)
        public
        returns (bool _success)
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        _success = allModerators.append(_user);
    }

    function removeFromModeratorList(address _user)
        public
        returns (bool _success)
    {
        require(sender_is(CONTRACT_DAO_STAKE_LOCKING));
        _success = allModerators.remove_item(_user);
    }

    function isInParticipantList(address _user)
        public
        constant
        returns (bool _is)
    {
        _is = allParticipants.find(_user) != 0;
    }

    function isInModeratorsList(address _user)
        public
        constant
        returns (bool _is)
    {
        _is = allModerators.find(_user) != 0;
    }

    function readFirstModerator()
        public
        constant
        returns (address _item)
    {
        _item = read_first_from_addresses(allModerators);
    }

    function readLastModerator()
        public
        constant
        returns (address _item)
    {
        _item = read_last_from_addresses(allModerators);
    }

    function readNextModerator(address _current_item)
        public
        constant
        returns (address _item)
    {
        _item = read_next_from_addresses(allModerators, _current_item);
    }

    function readPreviousModerator(address _current_item)
        public
        constant
        returns (address _item)
    {
        _item = read_previous_from_addresses(allModerators, _current_item);
    }

    function readTotalModerators()
        public
        constant
        returns (uint256 _total_count)
    {
        _total_count = read_total_addresses(allModerators);
    }

    function readFirstParticipant()
        public
        constant
        returns (address _item)
    {
        _item = read_first_from_addresses(allParticipants);
    }

    function readLastParticipant()
        public
        constant
        returns (address _item)
    {
        _item = read_last_from_addresses(allParticipants);
    }

    function readNextParticipant(address _current_item)
        public
        constant
        returns (address _item)
    {
        _item = read_next_from_addresses(allParticipants, _current_item);
    }

    function readPreviousParticipant(address _current_item)
        public
        constant
        returns (address _item)
    {
        _item = read_previous_from_addresses(allParticipants, _current_item);
    }

    function readTotalParticipant()
        public
        constant
        returns (uint256 _total_count)
    {
        _total_count = read_total_addresses(allParticipants);
    }
}
