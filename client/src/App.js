import React, {Component} from "react";
import {Button, Container} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Web3Context from "./store/web3-context";
import getWeb3 from "./getWeb3";
import VotingContract from "./contracts/Voting.json";

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
                    console.log('accountsChanges to', accounts[0]);
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
            // <Web3Context.Provider value={{ contract: this.state.contract, web3: this.state.web3, accounts: this.state.accounts, owner: this.state.owner }}>
            <Web3Context.Provider value={{ web3: this.state.web3, contract: this.state.contract, accounts: this.state.accounts, owner: this.state.owner }}>
                    <div className="App">
                        <Header/>
                        <Container className="main">
                            <h1>Good to Go!</h1>
                            <p>Your Truffle Box is installed and ready.</p>
                            <h2>Smart Contract Example</h2>
                            <p>
                                If your contracts compiled and migrated successfully, below will show
                                a stored value of 5 (by default).
                            </p>
                            <Button variant="primary">Primary</Button>
                            <p>
                                Try changing the value stored on <strong>line 42</strong> of App.js.
                            </p>
                            <div>The stored value is: {this.props.storageValue}</div>
                        </Container>
                        <Footer/>
                    </div>
            </Web3Context.Provider>
        );
    }
}

export default App;
