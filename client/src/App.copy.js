import React, {Component} from "react";
import {Button, Container, Spinner} from "react-bootstrap";
import VotingContract from "./contracts/Voting.json";
import 'bootstrap/dist/css/bootstrap.min.css';
import getWeb3 from "./getWeb3";

import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

class App extends Component {
    state = {storageValue: 0, web3: null, accounts: null, contract: null};

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

            console.log('Nework id ', networkId)
            console.log('Deployed at ', deployedNetwork.address)

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({web3, accounts, contract: instance}, this.runExample);
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    runExample = async () => {
        const {web3, accounts, contract} = this.state;

        // Stores a given value, 5 by default.
        // await contract.methods.set(5).send({ from: accounts[0] });
        console.log(accounts[0])

        // Get the value from the contract to prove it worked.
        const response = await contract.methods.workflowStatus().call();

        console.log(response)

        // Update state with the result.
        this.setState({storageValue: response});
    };

    render() {
        if (!this.state.web3) {
            return <div>
                Loading Web3, accounts, and contract...
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>;
        }
        return (
            <div className="App">
                <Header accounts={this.state.accounts} web3={this.state.web3}/>
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
                    <div>The stored value is: {this.state.storageValue}</div>
                </Container>
                <Footer web3={this.state.web3}/>
            </div>
        );
    }
}

export default App;
