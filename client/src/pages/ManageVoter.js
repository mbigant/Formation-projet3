import React, {Component, Fragment} from "react";
import {withRouter} from "react-router-dom";
import Web3Context from "../store/web3-context";
import {Alert, Button, Col, Container, Form, FormControl, InputGroup, Row} from "react-bootstrap";
import Web3 from "web3";
import Voter from '../components/Voter';
import ENS, {getEnsAddress} from "@ensdomains/ensjs";


class ManageVoter extends Component {

    static contextType = Web3Context;

    state = {
        inputAddress: null,
        inputError: null,
        isValid: false,
        contract: null,
        voters: [],
        workflowStatus: null
    };

    listenerConnected = false;

    constructor(props) {

        console.log('contructor')
        super(props);

        const provider = new Web3.providers.HttpProvider(
            "https://ropsten.infura.io/v3/d582c7d40d2148f590e23b2d7a812e20"
        );

        this.ens = new ENS({ provider, ensAddress: getEnsAddress('3') }); // 3 = ropsten but doesn't care
    }

    startListeningEvents() {

        this.listenerConnected = true;
        const voters = [];

        this.context.contract.events.VoterRegistered({fromBlock: 0})
            .on('data', event => {
                voters.push( event.returnValues.voterAddress );
                this.setState({voters : voters});
            })
            .on('error', event => { console.log('error') })
            .on('connected', event => { console.log('connected') });
    }

    componentDidMount() {
        console.log(this.props.match.params)
        console.log('componentDidMount')

        if( this.context.contract ) {
            this.startListeningEvents();
        }
    }

    async componentDidUpdate(prevProps, prevState) {

        // got context
        if( prevState.contract == null && this.state.contract == null && this.context.contract !== null ) {

            let workflowStatusResp;

            try {
                workflowStatusResp = parseInt(await this.context.contract.methods.workflowStatus().call());
            } catch (err) {
                console.log(err);
            }

            this.setState({
                contract: this.context.contract,
                workflowStatus: workflowStatusResp
            })

            if( ! this.listenerConnected ) {
                this.startListeningEvents();
            }
        }
    }

    registerAddress = (event) => {
        event.preventDefault();

        this.context.contract.once('VoterRegistered', {
            fromBlock: 25957319
        }, function(error, event){ console.log(event); });

        console.log( this.context.web3.eth.handleRevert );
        console.log( this.context.web3.version );

        this.context.contract.methods.addVoter(this.state.inputAddress).send({from: this.context.accounts[0]})
            .on('transactionHash', function (hash){
                console.log('on transactionHash');
                console.log(hash);
            })
            .on('confirmation', function (confirmationNumber, receip){
                console.log('on confirmation');
                console.log(confirmationNumber, receip);
            })
            .on('receipt', function (receipt){
                console.log('on receipt');
                console.log(receipt);
            })
            .on('error', function (error, receipt){
                console.log('on error');
                console.log(error, receipt);
            })

    }

    addressInputHandler = (event) => {
        const inputVal = event.target.value;

        if( inputVal.length > 4 && inputVal.trim().endsWith('.eth') ) {
            console.log('ens address !')

            this.ens.name(inputVal).getAddress().then( resp => {
                console.log(resp)
                if( resp && resp !== '0x0000000000000000000000000000000000000000') {
                    this.setState({
                        inputAddress: resp,
                        isValid: true,
                        inputError: null
                    });
                }
                else {
                    this.setState({
                        inputAddress: null,
                        isValid: false,
                        inputError: "ENS invalide !"
                    });
                }
            }).catch( err => {
                console.log(err);
                this.setState({
                    inputAddress: null,
                    isValid: false,
                    inputError: "ENS invalide !"
                });
            });
        }
        else {

            try {
                const validAddress = Web3.utils.toChecksumAddress(inputVal)
                this.setState({
                    inputAddress: validAddress,
                    isValid: true,
                    inputError: null
                });
            } catch (err) {
                this.setState({
                    inputAddress: null,
                    isValid: false,
                    inputError: "Adresse invalide !"
                });
            }
        }
    }

    render() {

        if( this.context.accounts.length > 0 && this.context.accounts[0].toLowerCase() === this.context.owner ) {

            return (
                <Fragment>
                    <h1>Gestion des votants</h1>
                    <Container>
                        <h4 className="mt-4">Ajouter un votant</h4>
                        <Form onSubmit={this.registerAddress.bind(this)} noValidate validated={false} >
                            <Row className="align-items-center">
                                <Col>
                                    <InputGroup className="mb-2" hasValidation>
                                        <InputGroup.Text>Ξ</InputGroup.Text>
                                        <FormControl
                                            disabled={this.state.workflowStatus !== 0}
                                            onBlur={this.addressInputHandler.bind(this)}
                                            placeholder="0x address or ENS"
                                            isValid={this.state.isValid}
                                            isInvalid={this.state.inputError !== null}
                                        />
                                        <Button type="submit" variant="primary" disabled={!this.state.isValid}>
                                            Ajouter
                                        </Button>
                                        <Form.Control.Feedback type="invalid">{this.state.inputError}</Form.Control.Feedback>
                                    </InputGroup>
                                </Col>
                            </Row>
                        </Form>
                    </Container>
                    <Container>
                        <Row>
                            <Col>
                                <h4 className="mt-4">Registered voters</h4>
                                <hr/>
                                {
                                    this.state.voters.length > 0 ?
                                    <Row xs={3} md={6}>
                                        {this.state.voters.map((address, id) => (
                                            <Col key={address}>
                                                <Voter address={address} id={id} instance={this.context.contract}/>
                                            </Col>
                                        ))}
                                    </Row>
                                    :
                                    <p>No voters yet</p>
                                }
                            </Col>
                        </Row>
                    </Container>
                </Fragment>
            );

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

export default withRouter(ManageVoter);