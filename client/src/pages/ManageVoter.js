import React, {Component, Fragment} from "react";
import {withRouter} from "react-router-dom";
import Web3Context from "../store/web3-context";
import {Button, Col, Container, Form, FormControl, InputGroup, Row} from "react-bootstrap";
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
        voters: []
    };

    constructor(props) {
        super(props);

        const provider = new Web3.providers.HttpProvider(
            "https://ropsten.infura.io/v3/d582c7d40d2148f590e23b2d7a812e20"
        );

        this.ens = new ENS({ provider, ensAddress: getEnsAddress('1') });
    }

    componentDidMount() {
        console.log(this.props.match.params)
    }

    componentDidUpdate(prevProps, prevState) {

        if( prevState.contract == null && this.state.contract == null && this.context.contract !== null ) {
            this.setState({contract: this.context.contract})

            const voters = [];

            this.context.contract.events.VoterRegistered({fromBlock: 0,})
                .on('data', event => {
                    voters.push( event.returnValues.voterAddress );
                    this.setState({voters : voters});
                    //console.log(event);
                })
                .on('error', event => { console.log('error') })
                .on('connected', event => { console.log('connected') });
        }

        // 2 0x6d142D76323262cE46696801be7B5FeAEfF13dAc
    }

    registerAddress = async (event) => {
        event.preventDefault();

        this.context.contract.once('VoterRegistered', {
            fromBlock: 25957319
        }, function(error, event){ console.log(event); });

        const resp = await this.context.contract.methods.addVoter(this.state.inputAddress).send({from: this.context.accounts[0]});
        //this.context.contract.methods.addVoter(this.state.inputAddress).send({from: this.context.accounts[0]});

        console.log(resp);
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
                                <h4 className="mt-4">Votans enregistrés</h4>
                                <hr/>
                                <Row xs={3} md={6}>
                                    {this.state.voters.map((address, id) => (
                                        <Col key={address}>
                                            <Voter address={address} id={id} instance={this.context.contract}/>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    </Container>
                </Fragment>
            );

        }
        else {
            return <h1>Only owner here !</h1>
        }

    }
}

export default withRouter(ManageVoter);