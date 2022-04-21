import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import Web3Context from "../store/web3-context";
import {Alert, Toast, ToastContainer} from "react-bootstrap";
import '../components/workflow.css'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {
    faCheck,
    faCheckToSlot,
    faFileCirclePlus,
    faTriangleExclamation,
    faTrophy,
    faUserPlus
} from '@fortawesome/free-solid-svg-icons'
import WorkflowStatusDetails from "../components/WorkflowStatusDetails";


class Workflow extends Component {

    static contextType = Web3Context;

    listenerConnected = false;

    state = {
        contractDeployedAt: null,
        currentStatus: null,
        events : null,
        showToast: true,
        toast: {
            visible: false,
            icon: faTriangleExclamation,
            title: '',
            message: '',
            variant: 'danger'
        }
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log(this.props.match.params)

        if( this.context.contract ) {
            this.startListeningEvents();
        }

        if( this.context.web3 ) {
            this.getCurrentStatus();
            this.getEvents();
            this.getContractDeployedTimestamp();
        }

    }

    componentDidUpdate(prevProps, prevState) {

        if( prevState.contractDeployedAt == null && this.state.contractDeployedAt == null && this.context.contractTxHash != null ) {
            this.getContractDeployedTimestamp();
        }

        if( this.state.events == null && this.context.contract ) {
            this.getEvents();
        }

        if( !this.listenerConnected && this.context.contract ){
            this.startListeningEvents();
        }

        if( prevState.currentStatus == null && this.context.contract ) {
            this.getCurrentStatus();
        }
    }

    getContractDeployedTimestamp() {
        this.context.web3.eth.getTransaction(this.context.contractTxHash).then( tx => {
            this.context.web3.eth.getBlock(tx.blockHash).then( block => {
                if( block.timestamp ) {
                    this.setState({contractDeployedAt: block.timestamp});
                }
            });
        })
    }

    getCurrentStatus() {

        this.context.contract.methods.workflowStatus().call().then(resp => {
            this.setState({currentStatus: parseInt(resp)});
        });
    }

    async getEvents() {

        this.context.contract.getPastEvents('WorkflowStatusChange', {fromBlock: 0}).then( events => {

            for( let event of events ) {
                this.updateEvent(event)
            }

        });
    }

    async updateEvent( event ) {

        const status = event.returnValues.newStatus;

        const block = await this.context.web3.eth.getBlock(event.blockHash);

        console.log('update event')

        this.setState( (prevState) => {

            if( prevState.events == null ) {
                let events = {};
                events[status] = {timestamp: block.timestamp};

                return prevState.events = events;
            }
            else {

                return prevState.events[status] = {
                    timestamp: block.timestamp
                }
            }

        });

        if( this.state.currentStatus < status ) {
            this.setState({currentStatus: status});
        }
    }

    startListeningEvents() {

        console.log('start listening events');

        this.listenerConnected = true;

        this.context.contract.events.WorkflowStatusChange()
            .on('data', event => {
                this.updateEvent(event)
            })
            .on('error', event => { console.log('error') })
            .on('connected', event => { console.log('connected') });
    }

    startProposalsRegistering() {
        console.log('startProposalsRegistering');

        this.context.contract.methods.startProposalsRegistering().send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log(hash);
            })
            .on('receipt', (receipt) => {
                this.showToast('Success', 'Workflow successfully updated', true);
            })
            .on('error', (error, receipt) => {
                this.showToast('Error', error.message, false);
            });
    }

    endProposalsRegistering() {
        console.log('endProposalsRegistering');

        this.context.contract.methods.endProposalsRegistering().send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log(hash);
            })
            .on('receipt', (receipt) => {
                this.showToast('Success', 'Workflow successfully updated', true);
            })
            .on('error', (error, receipt) => {
                this.showToast('Error', error.message, false);
            });
    }

    startVotingSession() {
        console.log('startVotingSession');

        this.context.contract.methods.startVotingSession().send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log(hash);
            })
            .on('receipt', (receipt) => {
                this.showToast('Success', 'Workflow successfully updated', true);
            })
            .on('error', (error, receipt) => {
                this.showToast('Error', error.message, false);
            });
    }

    endVotingSession() {
        console.log('endVotingSession');

        this.context.contract.methods.endVotingSession().send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log(hash);
            })
            .on('receipt', (receipt) => {
                this.showToast('Success', 'Workflow successfully updated', true);
            })
            .on('error', (error, receipt) => {
                this.showToast('Error', error.message, false);
            });
    }

    tallyVotes() {
        console.log('tallyVotes');

        this.context.contract.methods.tallyVotes().send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log(hash);
            })
            .on('receipt', (receipt) => {
                this.showToast('Success', 'Workflow successfully updated', true);
            })
            .on('error', (error, receipt) => {
                this.showToast('Error', error.message, false);
            });
    }

    showToast( title, message, isSuccess ) {
       const type = isSuccess ? 'success' : 'danger';
       const faIcon = isSuccess ? faCheck : faTriangleExclamation;

       this.setState({
           toast: {
               icon: faIcon,
               variant: type,
               title: title,
               message: message,
               visible: true,
           }
       })
    }

    closeToast() {
        this.setState(state => {
            return state.toast.visible = false;
        });
    }

    render() {

        if( this.context.accounts.length > 0 && this.context.accounts[0].toLowerCase() === this.context.owner ) {
            return (
                <div className="container mb-5">
                    <div className="page-header">
                        <h1 id="timeline">Voting status</h1>
                    </div>
                    <ul className="timeline">
                        <WorkflowStatusDetails
                            faIcon={faUserPlus}
                            timestamp={this.state.contractDeployedAt}
                            title="RegisteringVoters"
                            description="Voters can be registered by admin"
                            statusValue={0}
                            currentWorkflowStatus={this.state.currentStatus}
                        />

                        <WorkflowStatusDetails
                            faIcon={faFileCirclePlus}
                            timestamp={this.state.events && this.state.events[1] ? this.state.events[1].timestamp : null}
                            title="ProposalsRegistrationStarted"
                            description="Voters can register their proposals"
                            statusValue={1}
                            currentWorkflowStatus={this.state.currentStatus}
                            activate={this.startProposalsRegistering.bind(this)}
                        />

                        <WorkflowStatusDetails
                            faIcon={faFileCirclePlus}
                            timestamp={this.state.events && this.state.events[2] ? this.state.events[2].timestamp : null}
                            title="ProposalsRegistrationEnded"
                            description="Registering proposals is now ended"
                            statusValue={2}
                            currentWorkflowStatus={this.state.currentStatus}
                            activate={this.endProposalsRegistering.bind(this)}
                        />

                        <WorkflowStatusDetails
                            faIcon={faCheckToSlot}
                            timestamp={this.state.events && this.state.events[3] ? this.state.events[3].timestamp : null}
                            title="VotingSessionStarted"
                            description="Voters can vote for proposals"
                            statusValue={3}
                            currentWorkflowStatus={this.state.currentStatus}
                            activate={this.startVotingSession.bind(this)}
                        />

                        <WorkflowStatusDetails
                            faIcon={faCheckToSlot}
                            timestamp={this.state.events && this.state.events[4] ? this.state.events[4].timestamp : null}
                            title="VotingSessionEnded"
                            description="Voter can no longer vote"
                            statusValue={4}
                            currentWorkflowStatus={this.state.currentStatus}
                            activate={this.endVotingSession.bind(this)}
                        />

                        <WorkflowStatusDetails
                            faIcon={faTrophy}
                            timestamp={this.state.events && this.state.events[5] ? this.state.events[5].timestamp : null}
                            title="VotesTallied"
                            description="We got a winner !"
                            statusValue={5}
                            currentWorkflowStatus={this.state.currentStatus}
                            activate={this.tallyVotes.bind(this)}
                        />

                    </ul>
                    <ToastContainer className="p-3 mb-5" position="bottom-end">
                        <Toast show={this.state.toast.visible} onClose={this.closeToast.bind(this)} delay={5000} autohide bg={this.state.toast.variant}>
                            <Toast.Header>
                                <strong className="me-auto pl-2">
                                    <FontAwesomeIcon icon={this.state.toast.icon}/> {this.state.toast.title}
                                </strong>
                                <small>just now</small>
                            </Toast.Header>
                            <Toast.Body>{this.state.toast.message}</Toast.Body>
                        </Toast>
                    </ToastContainer>
                </div>
            )
        }
        else {
            return (
                <Alert variant="danger">
                    <Alert.Heading>You are not allowed</Alert.Heading>
                    <p>
                        Only contract owner authorized here !
                    </p>
                </Alert>
            )
        }

    }
}

export default withRouter(Workflow);