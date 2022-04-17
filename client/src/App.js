import React, {Component} from "react";
import {Container} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Web3Context from "./store/web3-context";
import getWeb3 from "./getWeb3";
import VotingContract from "./contracts/Voting.json";
import {Route, Switch} from "react-router-dom";
import ManageVoter from "./pages/ManageVoter";
import Workflow from "./pages/Workflow";


class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            accounts: [],
            contract: null,
            owner: null
        };
    }

    componentDidMount = async () => {

        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = VotingContract.networks[networkId];
            const instance = new web3.eth.Contract(
                VotingContract.abi,
                deployedNetwork && deployedNetwork.address,
            );

            const owner = await instance.methods.owner().call();

            // console.log('Nework id ', networkId)
            // console.log('Deployed at ', deployedNetwork.address)
            // console.log('Owner is ', owner)

            if( window.ethereum ) {
                // detect Metamask account change
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.setState({accounts})
                });

                // detect Network account change
                window.ethereum.on('networkChanged', function(newNetworkId){
                    if( newNetworkId !== networkId ) {
                        alert(`Please change network to Mumbai`);
                    }
                });
            }

            // instance.events.VoterRegistered({})
            //     .on('data', event => { console.log(event) })
            //     .on('error', event => { console.log('error') })
            //     .on('connected', event => { console.log('connected') });
            //
            //
            // instance.events.VoterRegistered({
            //     fromBlock: 25958180,
            // }, function(err, event) {
            //     if( err ) {
            //         console.log(err)
            //     }
            //     console.log(event.returnValues.voterAddress)
            // });

            const voter = await instance.methods.getVoter('0xa9e5c6C46C47c8f59BE35b41e2f76cb893178FA5').call();

            console.log(voter)


            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts, contract: instance, owner: owner.toLowerCase()});

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    render() {

        return (
            <Web3Context.Provider value={{ web3: this.state.web3, contract: this.state.contract, accounts: this.state.accounts, owner: this.state.owner }}>
                    <div className="App">
                        <Header/>
                        <Container className="main">
                            <Switch>
                                <Route path="/admin/voters/">
                                    <ManageVoter/>
                                </Route>
                                <Route path="/admin/workflow/">
                                    <Workflow/>
                                </Route>
                                <Route path="/proposals/" exact>
                                    <h1>proposals</h1>
                                </Route>
                                <Route path="/proposals/:id">
                                    <h1>proposal detail</h1>
                                </Route>
                            </Switch>
                        </Container>
                        <Footer/>
                    </div>
            </Web3Context.Provider>
        );
    }
}

export default App;
