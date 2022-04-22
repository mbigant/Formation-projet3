const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require('Voting');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { expectEvent } = require('@openzeppelin/test-helpers');

contract('Voting', function (accounts) {

    const [ owner, voter1, voter2, voter3, anon ] = accounts;
    const [ RegisteringVotersStatus, ProposalsRegistrationStartedStatus, ProposalsRegistrationEndedStatus, VotingSessionStartedStatus, VotingSessionEndedStatus, VotesTalliedStatus] = [0, 1, 2, 3, 4, 5];

    describe('Workflow', function() {

        describe('At initial state', function () {

            let votingInstance;

            before(async function () {
                votingInstance = await Voting.deployed();
            });

            it('should have status set to "RegisteringVoters"', async function () {
                const expected = new BN(RegisteringVotersStatus);
                expect( await votingInstance.workflowStatus() ).to.be.bignumber.equal(expected);
            });

            it('should revert on adding proposal', async function(){
                await expectRevert( votingInstance.addProposal('Proposal 1', {from: voter1}), "You're not a voter" )
            });

            it('should revert on voting', async function(){
                await expectRevert( votingInstance.setVote( new BN(0), {from: voter1}), "You're not a voter" )
            });

            it('should revert if ending proposal registering', async function(){
                await expectRevert( votingInstance.endProposalsRegistering(), 'Registering proposals havent started yet' );
            });

            it('should revert if starting voting session', async function(){
                await expectRevert( votingInstance.startVotingSession(), 'Registering proposals phase is not finished' );
            });

            it('should revert if ending voting session', async function(){
                await expectRevert( votingInstance.endVotingSession(), 'Voting session havent started yet' );
            });

            it('should revert if tallying votes', async function(){
                await expectRevert( votingInstance.tallyVotes(), 'Current status is not voting session ended' );
            });

        });

        describe('When registering a voter', function(){

            let votingInstance;

            before( async function () {
                votingInstance = await Voting.deployed();
            });

            after( async function () {
                // registering other voters
                await votingInstance.addVoter(voter2, {from: owner})
                await votingInstance.addVoter(voter3, {from: owner})
            });

            it('should emit a "VoterRegistered" event', async function(){
                expectEvent( await votingInstance.addVoter(voter1, {from: owner}), 'VoterRegistered', {_voterAddress: voter1} )
            });

            it('should set voter as "Registered"', async function(){
                const voter = await votingInstance.getVoter(voter1, {from:voter1});
                expect( voter.isRegistered ).to.be.true;
            });

            it('should revert if already registered', async function () {
                await expectRevert( votingInstance.addVoter(voter1, {from: owner}), 'Already registered' )
            });

        });

        describe('When proposal registering starts', function(){

            let votingInstance;

            before ( async function () {
                votingInstance = await Voting.deployed();
            });

            it('should emit a "WorkflowStatusChange" event', async function(){
                const startProposalsRegisteringTx = await votingInstance.startProposalsRegistering({from: owner});
                shouldEmitWorkflowStatusChange(startProposalsRegisteringTx, ProposalsRegistrationStartedStatus);
            });

            it('should set status to "ProposalsRegistrationStarted"', async function(){
                await shouldChangeWorkflowStatus(votingInstance, ProposalsRegistrationStartedStatus);
            });

            it('should revert if proposal registering already started', async function(){
                await expectRevert( votingInstance.startProposalsRegistering({from: owner}), 'Registering proposals cant be started now' );
            });

            it('should revert if adding voter', async function(){
                await expectRevert( votingInstance.addVoter(voter1, {from: owner}), 'Voters registration is not open yet' );
            });

            describe('When a voter register a proposal', function(){

                let votingInstance;

                before ( async function () {
                    votingInstance = await Voting.deployed();
                });

                after( async function () {
                    // adding some more proposals
                    await votingInstance.addProposal('Proposal from voter 2', {from: voter2});
                    await votingInstance.addProposal('Proposal from voter 3', {from: voter3});
                });

                const proposal1 = 'Proposal1 from voter1';
                const proposal2 = 'Proposal2 from voter1';

                it('should emit a "ProposalRegistered" event', async function(){
                    const proposalRegisteredTx = await votingInstance.addProposal(proposal1, {from: voter1});
                    expectEvent( proposalRegisteredTx, 'ProposalRegistered', {_proposalId: new BN(0)} )
                });

                it('should revert if description is blank', async function(){
                    await expectRevert( votingInstance.addProposal('', {from: voter1}), "Vous ne pouvez pas ne rien proposer");
                });

                it('should let voter adding multiple proposal', async function(){
                    const proposalRegisteredTx = await votingInstance.addProposal(proposal2, {from: voter1});
                    expectEvent( proposalRegisteredTx, 'ProposalRegistered', {_proposalId: new BN(1)} )
                });

            });

        });

        describe('When proposal registering ends', function(){

            let votingInstance;

            before ( async function () {
                votingInstance = await Voting.deployed();
            });

            it('should emit a "WorkflowStatusChange" event', async function(){
                const endProposalsRegisteringTx = await votingInstance.endProposalsRegistering({from: owner});
                shouldEmitWorkflowStatusChange(endProposalsRegisteringTx, ProposalsRegistrationEndedStatus);
            });

            it('should set status to "ProposalsRegistrationEnded"', async function(){
                await shouldChangeWorkflowStatus(votingInstance, ProposalsRegistrationEndedStatus);
            });

            it('should revert if voter registered a proposal', async function(){
                await expectRevert( votingInstance.addProposal('Too late Proposal', {from: voter1}), "Proposals are not allowed yet");
            });

        });

        describe('When voting session starts', function(){

            let votingInstance;

            before ( async function () {
                votingInstance = await Voting.deployed();
            });

            it('should emit a "WorkflowStatusChange" event', async function(){
                const startVotingSessionTx = await votingInstance.startVotingSession({from: owner});
                shouldEmitWorkflowStatusChange(startVotingSessionTx, VotingSessionStartedStatus);
            });

            it('should set status to "VotingSessionStarted"', async function(){
                await shouldChangeWorkflowStatus(votingInstance, VotingSessionStartedStatus);
            });

            describe('When voter vote for proposal', function () {

                let proposal1;
                const proposalIdVotedByVoter1 = new BN(0);

                after( async function(){
                    // adding more vote, winner will be proposalId 1
                    await votingInstance.setVote(new BN(1), {from: voter2});
                    await votingInstance.setVote(new BN(1), {from: voter3});
                });

                before( async function(){
                    proposal1 = await votingInstance.getOneProposal(proposalIdVotedByVoter1, {from: voter1});
                });

                it('should emit a "Voted" event', async function(){
                    const voteTx = await votingInstance.setVote(proposalIdVotedByVoter1, {from: voter1});
                    expectEvent( voteTx, "Voted", {_voter: voter1, _proposalId: proposalIdVotedByVoter1});
                });

                it('should increase proposal voteCount', async function () {
                    const proposalAfterVoting = await votingInstance.getOneProposal(proposalIdVotedByVoter1, {from: voter1});
                    expect( proposalAfterVoting.voteCount ).to.be.bignumber.equal( new BN(proposal1.voteCount).add(new BN(1)) );
                });

                it('should set voter hasVoted', async function () {
                    const voter = await votingInstance.getVoter(voter1, {from: voter1});
                    expect( voter.hasVoted ).to.be.true;
                });

                it('should set voted proposalId on voter', async function () {
                    const voter = await votingInstance.getVoter(voter1, {from: voter1});
                    expect( voter.votedProposalId ).to.be.bignumber.equal(proposalIdVotedByVoter1);
                });

                it('should revert if already voted', async function(){
                    await expectRevert( votingInstance.setVote(proposalIdVotedByVoter1, {from: voter1}), "You have already voted");
                });

                it('should revert if proposal does not exists', async function(){
                    await expectRevert( votingInstance.setVote(new BN(42), {from: voter2}), "Proposal not found");
                });

            });

        });

        describe('When voting session ends', function(){

            let votingInstance;

            before ( async function () {
                votingInstance = await Voting.deployed();
            });

            it('should emit a "WorkflowStatusChange" event', async function(){
                const endVotingSessionTx = await votingInstance.endVotingSession({from: owner});
                shouldEmitWorkflowStatusChange(endVotingSessionTx, VotingSessionEndedStatus);
            });

            it('should set status to "VotingSessionEnded"', async function(){
                await shouldChangeWorkflowStatus(votingInstance, VotingSessionEndedStatus);
            });

            it('should revert if voter try voting for proposal', async function(){
                await expectRevert( votingInstance.setVote(new BN(0), {from: voter1}), "Voting session havent started yet");
            });
        });

        describe('When votes are talled', function(){

            let votingInstance;

            before ( async function () {
                votingInstance = await Voting.deployed();
            });

            it('should emit a "WorkflowStatusChange" event', async function(){
                const tallVotesTx = await votingInstance.tallyVotes({from: owner});
                shouldEmitWorkflowStatusChange(tallVotesTx, VotesTalliedStatus);
            });

            it('should set status to "VotesTallied"', async function(){
                await shouldChangeWorkflowStatus(votingInstance, VotesTalliedStatus);
            });

            it('should get a winner for everybody asking for', async function(){
                expect( await votingInstance.winningProposalId.call({from: anon}) ).to.be.bignumber.equal( new BN(1) )
            });
        });
    });

    describe('Admin scope', function () {

        let votingInstance;
        const ownableRevertMessage = "Ownable: caller is not the owner";

        before( async function(){
            votingInstance = await Voting.new({from: owner});
        });

        it('should revert if not contract owner call addVoter', async function () {
            await expectRevert( votingInstance.addVoter(voter1, {from: anon}), ownableRevertMessage);
        });

        it('should revert if not contract owner call startProposalsRegistering', async function () {
            await expectRevert( votingInstance.startProposalsRegistering({from: anon}), ownableRevertMessage);
        });

        it('should revert if not contract owner call endProposalsRegistering', async function () {
            await expectRevert( votingInstance.endProposalsRegistering({from: anon}), ownableRevertMessage);
        });

        it('should revert if not contract owner call startVotingSession', async function () {
            await expectRevert( votingInstance.startVotingSession({from: anon}), ownableRevertMessage);
        });

        it('should revert if not contract owner call endVotingSession', async function () {
            await expectRevert( votingInstance.endVotingSession({from: anon}), ownableRevertMessage);
        });

        it('should revert if not contract owner call tallyVotes', async function () {
            await expectRevert( votingInstance.tallyVotes({from: anon}), ownableRevertMessage);
        });

    });

    describe('Voter scope', function () {

        let votingInstance;
        const onlyVoterRevertMessage = "You're not a voter";

        before( async function(){
            votingInstance = await Voting.new({from: owner});
        });

        it('should revert if non voter call addProposal', async function () {
            await expectRevert( votingInstance.addProposal("Proposal", {from: anon}), onlyVoterRevertMessage);
        });

        it('should revert if non voter call getOneProposal', async function () {
            await expectRevert( votingInstance.getOneProposal( new BN(0), {from: anon}), onlyVoterRevertMessage);
        });

        it('should revert if non voter call getVoter', async function () {
            await expectRevert( votingInstance.getVoter( voter2, {from: anon}), onlyVoterRevertMessage);
        });

        it('should revert if non voter call setVote', async function () {
            await expectRevert( votingInstance.setVote( new BN(0), {from: anon}), onlyVoterRevertMessage);
        });

    });

    async function shouldChangeWorkflowStatus( contractInstance, expectedStatus ) {
        const expected = new BN(expectedStatus);
        expect( await contractInstance.workflowStatus() ).to.be.bignumber.equal(expected);
    }

    function shouldEmitWorkflowStatusChange( tx, newStatus ) {
        const prevExpectedStatus = new BN(newStatus-1);
        const newExpectedStatus = new BN(newStatus);
        expectEvent( tx, 'WorkflowStatusChange', {_previousStatus: prevExpectedStatus, _newStatus: newExpectedStatus} )
    }

});