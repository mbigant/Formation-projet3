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
import Vote from "./pages/Vote";


class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            accounts: [],
            contract: null,
            owner: null,
            contractAddress: null,
            contractTxHash: null,
        };
    }

    componentDidMount = async () => {

        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();
            web3.eth.handleRevert = true;

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


            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts, contract: instance, owner: owner.toLowerCase(), contractAddress: deployedNetwork.address, contractTxHash: deployedNetwork.transactionHash });

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
            <Web3Context.Provider value={{ web3: this.state.web3, contract: this.state.contract, accounts: this.state.accounts, owner: this.state.owner, contractAddress: this.state.contractAddress, contractTxHash: this.state.contractTxHash }}>
                    <div className="App">
                        <Header/>
                        <Container className="main">
                            <Switch>
                                <Route exact path="/">
                                    <Vote/>
                                </Route>
                                <Route path="/admin/voters/">
                                    <ManageVoter/>
                                </Route>
                                <Route path="/admin/workflow/">
                                    <Workflow/>
                                </Route>
                                <Route exact path="/proposals/">
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
