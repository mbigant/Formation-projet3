import React, {Component, Fragment} from "react";
import VotingContract from "./../contracts/Voting.json";

import getWeb3 from "./../getWeb3";
import Web3Context from "../store/web3-context";

class Web3Layout extends Component {

    static contextType = Web3Context;

    constructor(props) {
        super(props);
    }

    componentDidMount = async () => {
        console.log(this.context)
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
            this.setState({web3, accounts, contract: instance});

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
            <Fragment>
                <main>{this.props.children}</main>
            </Fragment>
        );
    }
}

export default Web3Layout;