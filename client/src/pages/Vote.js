import React, {Component} from "react";
import Web3Context from "../store/web3-context";
import {Alert, Button, Card, Col, Container, Row} from "react-bootstrap";
import ProposalModal from "../components/ProposalModal";
import Moment from "react-moment";
import './vote.css';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTrophy} from "@fortawesome/free-solid-svg-icons";

class Vote extends Component {

    static contextType = Web3Context;

    state = {
        voter: null,
        currentAccount: null,
        proposals: null,
        workflowStatus: null,
        showModal: false,
        newProposalDescription: null,
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {

    }

    async componentDidUpdate(prevProps, prevState) {

        if( this.context.accounts.length > 0 && this.context.accounts[0] !== this.state.currentAccount ) {

            let voterFound = false;
            const events = await this.context.contract.getPastEvents('VoterRegistered', {fromBlock: 0});

            for( let event of events ) {
                const voterAddress = event.returnValues._voterAddress.toLowerCase();

                if( voterAddress === this.context.accounts[0].toLowerCase() ) {
                    voterFound = true;
                    const result = await this.context.contract.methods.getVoter(voterAddress).call({from: voterAddress});

                    const voter = {
                        isRegistered: result[0],
                        hasVoted: result[1],
                        votedProposalId: result[2]
                    };

                    this.setState({
                        currentAccount: this.context.accounts[0],
                        voter: voter
                    });

                    break;
                }
            }

        }

        if( this.context.contract && this.state.proposals == null && prevState.proposals == null ) {

            console.log('fetch proposals')

            const events = await this.context.contract.getPastEvents('ProposalRegistered', {fromBlock: 0});

            const proposalList = [];

            for( let event of events ) {

                const block = await this.context.web3.eth.getBlock(event.blockHash);
                const proposal = await this.context.contract.methods.getOneProposal(event.returnValues._proposalId).call({from: this.context.accounts[0]});

                proposalList.push({
                    id: event.returnValues._proposalId,
                    description: proposal.description,
                    voteCount: proposal.voteCount,
                    timestamp: block.timestamp
                })
            }

            this.setState({proposals: proposalList});
        }

        if( this.context.contract && this.state.workflowStatus == null ) {

            const result = await this.context.contract.methods.workflowStatus().call();

            this.setState({
                workflowStatus: parseInt(result)
            })

            if( parseInt(result) === 5 ) {
                console.log('fetching winner')
                const winner = await this.context.contract.methods.winningProposalId().call();
                console.log(winner)

                for( let i in this.state.proposals ) {

                    if( this.state.proposals[i].id === winner ) {
                        console.log('winner found')
                        this.setState((prevState) => {
                            return prevState.proposals[i].isWinner = true;
                        });
                        break;
                    }
                }
            }

        }

    }

    onHideHandler() {
        console.log('on Hide')
        this.setState({showModal: false});
    }

    onSubmitHandler() {
        console.log('on Submit')
        this.context.contract.once('ProposalRegistered', (err, event) => {

            this.context.web3.eth.getBlock(event.blockHash).then( block => {

                this.context.contract.methods.getOneProposal(event.returnValues._proposalId).call({from: this.context.accounts[0]}).then( proposal => {

                    this.setState( (prevState) => {
                        return prevState.proposals.push({
                            id: event.returnValues._proposalId,
                            description: proposal.description,
                            voteCount: proposal.voteCount,
                            timestamp: block.timestamp
                        });
                    });
                });
            });


        });

        this.context.contract.methods.addProposal(this.state.newProposalDescription).send({from: this.context.accounts[0]}).then( res => {
            console.log(res); // todo toast
        });

        this.setState({
            newProposalDescription: null,
            showModal: false
        });
    }

    onDescriptionChanged(e) {
        this.setState({newProposalDescription: e.target.value});
    }

    showModal() {
        this.setState({showModal: true});
    }

    onVote( proposalId ) {
        this.context.contract.once('Voted', (err, event) => {
            if( !err ) {
                for( let i in this.state.proposals ) {
                    if( parseInt(this.state.proposals[i].id) === parseInt(event.returnValues._proposalId) ) {
                        this.setState((prevState) => {
                            return prevState.proposals[i].voteCount++;
                        });
                        break;
                    }
                }
            }
        });

        this.context.contract.methods.setVote(proposalId).send({from : this.context.accounts[0]}).then( res => {

            this.setState( (prevState) => {
                prevState.voter.votedProposalId = proposalId;
                prevState.voter.hasVoted = true;
                return prevState;
            });
        }).catch(err => {
            console.log(err)
        });
    }

    render() {

        if ( this.state.voter ) {
            return (
                <Container className="mb-5">
                    <h1 className="mb-4">Proposals</h1>
                    {
                        this.state.workflowStatus < 1 &&
                        <Alert variant="warning">
                            <p>
                                Proposal registration not started !
                            </p>
                        </Alert>
                    }
                    <ProposalModal
                        show={this.state.showModal}
                        disabled={this.state.newProposalDescription == null || this.state.newProposalDescription.length === 0}
                        onHide={this.onHideHandler.bind(this)}
                        onSubmit={this.onSubmitHandler.bind(this)}
                        onDescriptionChanged={this.onDescriptionChanged.bind(this)}
                    />
                    <Row xs={1} md={3} className="g-4">
                        { this.state.workflowStatus === 1 && (
                            <Col>
                                <Card border="primary">
                                    <Card.Body>
                                        <Card.Title>Add Proposal</Card.Title>
                                        <Card.Text>
                                            You can submit your own proposal !
                                        </Card.Text>
                                        <Button variant="primary" onClick={this.showModal.bind(this)}>Submit my proposal</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                        { this.state.proposals && this.state.proposals.map((proposal, idx) => (
                            <Col key={idx}>
                                <Card className="position-relative"  border={proposal.isWinner ? 'success' : ''}>
                                    { this.state.workflowStatus > 2 && proposal.voteCount > 0 && <span className={`position-absolute top-0 start-50 translate-middle badge rounded-pill ${proposal.isWinner ? 'bg-success': 'bg-primary'}`}>{proposal.isWinner ? 'Winner - ' : ''} {proposal.voteCount} vote{proposal.voteCount > 1 ? 's' : ''}</span> }

                                    <Card.Body>
                                        <Card.Title>
                                            Proposal #{proposal.id}
                                        </Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted fs-6 font-monospace"><Moment parse="X" format="YYYY-MM-DD HH:mm">{proposal.timestamp}</Moment></Card.Subtitle>
                                        <Card.Text>
                                            { proposal.isWinner && <div><FontAwesomeIcon className="text-success" icon={faTrophy}/></div> }
                                            {proposal.description}
                                        </Card.Text>
                                        { this.state.workflowStatus === 3 && ! this.state.voter.hasVoted && <Button variant="outline-primary" onClick={this.onVote.bind(this, proposal.id)}>Vote for me !</Button> }
                                    </Card.Body>
                                    <Card.Footer className="text-muted">
                                        { this.state.workflowStatus < 3 ? 'Voting session not opened' :  this.state.voter.hasVoted && this.state.voter.votedProposalId === proposal.id ? 'Your choice' : this.state.workflowStatus > 3 ? 'Vote closed': 'Vote opened'}
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            )
        }
        else {
            return (
                <Alert variant="danger">
                    <Alert.Heading>Only voter</Alert.Heading>
                    <p>
                        You are not a voter !
                    </p>
                </Alert>
            )
        }

    }

}

export default Vote;