import React, {Component} from "react";
import Web3Context from "../store/web3-context";
import {Alert, Button, Card, Col, Container, Row} from "react-bootstrap";
import ProposalModal from "../components/ProposalModal";

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
                const voterAddress = event.returnValues.voterAddress.toLowerCase();

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

                const proposal = await this.context.contract.methods.getOneProposal(event.returnValues.proposalId).call({from: this.context.accounts[0]});

                proposalList.push({
                    id: event.returnValues.proposalId,
                    description: proposal.description,
                    voteCount: proposal.voteCount
                })
            }

            this.setState({proposals: proposalList});
        }

        if( this.context.contract && this.state.workflowStatus == null ) {

            const result = await this.context.contract.methods.workflowStatus().call();

            this.setState({
                workflowStatus: parseInt(result)
            })
        }

    }

    onHideHandler() {
        console.log('on Hide')
        this.setState({showModal: false});
    }

    onSubmitHandler() {
        console.log('on Submit')
        this.context.contract.once('ProposalRegistered', (err, event) => {

            this.context.contract.methods.getOneProposal(event.returnValues.proposalId).call({from: this.context.accounts[0]}).then( proposal => {

                this.setState( (prevState) => {
                   return prevState.proposals.push({
                       id: event.returnValues.proposalId,
                       description: proposal.description,
                       voteCount: proposal.voteCount
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

    render() {

        if ( this.state.voter ) {
            return (
                <Container className="mb-5">
                    <ProposalModal
                        show={this.state.showModal}
                        disabled={this.state.newProposalDescription == null || this.state.newProposalDescription.length === 0}
                        onHide={this.onHideHandler.bind(this)}
                        onSubmit={this.onSubmitHandler.bind(this)}
                        onDescriptionChanged={this.onDescriptionChanged.bind(this)}
                    />
                    <Row xs={1} md={3} className="g-4">
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
                        { this.state.proposals && this.state.proposals.map((proposal, idx) => (
                            <Col key={idx}>
                                <Card>
                                    <Card.Body>
                                        <Card.Title>Proposal #{proposal.id}</Card.Title>
                                        <Card.Text>
                                            {proposal.description}
                                        </Card.Text>
                                        { this.state.workflowStatus === 3 && <Button variant="outline-primary">Vote for me !</Button> }
                                    </Card.Body>
                                    <Card.Footer className="text-muted">
                                        { this.state.workflowStatus > 2 ? `${proposal.voteCount} vote` : 'Voting session not opened' }
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