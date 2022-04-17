import React, {Component, Fragment} from "react";
import {Badge, Card} from "react-bootstrap";
import makeBlockie from "ethereum-blockies-base64";
import Web3Context from "../store/web3-context";

class Voter extends Component {

    static contextType = Web3Context;

    state = {
        isRegistered: false,
        hasVoted: false,
        votedProposalId: null
    };

    constructor(props) {
        super(props);

    }

    async componentDidMount() {

        try {
            const voter = await this.props.instance.methods.getVoter(this.props.address).call();
            this.setState({
                isRegistered: voter[0],
                hasVoted: voter[1],
                votedProposalId: voter[2]
            });
        } catch (err) {
            console.error(err);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    render() {
        return (
            <Fragment>
                <Card>
                    <Card.Img variant="top" src={makeBlockie(this.props.address)} />
                    <Card.Body>
                        <Card.Title>Voter #{this.props.id}</Card.Title>
                        <Card.Text>
                            {this.props.address.slice(-6)}
                        </Card.Text>
                        <Badge bg="secondary">{this.state.isRegistered ? 'Registered' : 'Non registered'}</Badge>
                        {
                            this.state.hasVoted ?  <Badge bg="success">Voted for #{this.state.votedProposalId}</Badge> : ''
                        }
                    </Card.Body>
                </Card>
            </Fragment>
        );
    }

}

export default Voter;