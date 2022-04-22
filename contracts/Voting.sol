// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;
import "@openzeppelin/contracts/access/Ownable.sol";


contract Voting is Ownable {

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
        uint8 proposalCount;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @dev Id of the winning proposal
    uint public winningProposalId;

    /// @dev Current status of the voting session
    WorkflowStatus public workflowStatus;

    /// @dev Array of proposals
    Proposal[] private proposalsArray;

    /// @dev Mapping from address to voter
    mapping (address => Voter) private voters;

    event VoterRegistered(address _voterAddress);
    event WorkflowStatusChange(WorkflowStatus _previousStatus, WorkflowStatus _newStatus);
    event ProposalRegistered(uint _proposalId);
    event Voted(address _voter, uint _proposalId);

    /// @dev Revert if called by an unregistered voter address.
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    /**
     * @dev Return a voter associated with the address `_addr`
     * @param _addr Voter address
     *
     * Requirements:
     * - `msg.sender`must be a registered voter
     */
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /**
     * @dev Return proposal associated with the id `_id`
     * @param _id Proposal index
     *
     * Requirements:
     * - `msg.sender`must be a registered voter
     */
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /**
     * @dev Register an address to be a voter.
     * @param _addr Voter address to add
     *
     * Emits a {VoterRegistered} event.
     *
     * Requirements:
     *
     * - `msg.sender` must be the owner.
     *
     */
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    /**
     * @dev Add a new proposal to the list.
     * @notice A registered address can submit a proposal during registration period.
     * @param _desc Description of the proposal
     *
     * Emits a {ProposalRegistered} event.
     %
     * Requirements:
     *
     * - `status` must be ProposalsRegistrationStarted.
     * - `msg.sender` must be a registered voter.
     *
     */
    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer'); // facultatif
        require(voters[msg.sender].proposalCount <= 5, 'Vous ne pouvez pas proposer plus de 5 propositions');

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        voters[msg.sender].proposalCount++;
        emit ProposalRegistered(proposalsArray.length-1);
    }

    /**
    * @dev Register a vote for proposal.
    * @param _id Id of the proposal to vote for
    *
    * Emits a {Voted} event.
    *
    * Requirements:
    *
    * - `status` must be VotingSessionStarted.
    * - `_proposalId` must exist.
    * - `msg.sender` must have not vote yet.
    * - `msg.sender` must be a registered voter.
    *
    */
    function setVote( uint _id ) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        emit Voted(msg.sender, _id);
    }

    /**
    * @dev Set WorkflowStatus to ProposalsRegistrationStarted.
    * @notice Voter can now register proposals.
    *
    * Emits a {WorkflowStatusChange} event.
    *
    * Requirements:
    *
    * - `status` must be RegisteringVoters.
    * - `msg.sender` must be the owner.
    *
    */
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /**
    * @dev Set WorkflowStatus to ProposalsRegistrationEnded.
    * @notice Voter can no longer register proposals.
    *
    * Emits a {WorkflowStatusChange} event.
    *
    * Requirements:
    *
    * - `status` must be ProposalsRegistrationStarted.
    * - `msg.sender` must be the owner.
    *
    */
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
    * @dev Set WorkflowStatus to VotingSessionStarted.
    * @notice Voter can now vote for proposal.
    *
    * Emits a {WorkflowStatusChange} event.
    *
    * Requirements:
    *
    * - `status` must be ProposalsRegistrationEnded.
    * - `msg.sender` must be the owner.
    *
    */
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /**
    * @dev Set WorkflowStatus to VotingSessionEnded.
    * @notice Voter can no longer vote for proposal.
    *
    * Emits a {WorkflowStatusChange} event.
    *
    * Requirements:
    *
    * - `status` must be VotingSessionStarted.
    * - `msg.sender` must be the owner.
    *
    */
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /**
    * @dev Find the winner of the vote.
    * @notice Get the winner which is the proposal with the highest `voteCount`.
    *
    * Emits a {WorkflowStatusChange} event.
    *
    * Requirements:
    *
    * - `status` must be VotingSessionEnded.
    * - `msg.sender` must be the owner.
    *
    */
    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                _winningProposalId = p;
            }
        }

        winningProposalId = _winningProposalId;

        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}