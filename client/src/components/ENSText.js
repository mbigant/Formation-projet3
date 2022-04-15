import React, {Component, Fragment} from "react";
import Web3 from "web3";
import ENS, {getEnsAddress} from "@ensdomains/ensjs";
import {Badge} from "react-bootstrap";
import * as Utils from "../utils";

class ENSText extends Component {

    constructor(props) {

        super(props);

        this.state = {
            address: null,
            addressPreview: null,
            ens: null
        };

        const provider = new Web3.providers.HttpProvider(
            "https://ropsten.infura.io/v3/d582c7d40d2148f590e23b2d7a812e20"
        );

        this.ens = new ENS({ provider, ensAddress: getEnsAddress('1') });
    }

    getEns( address ) {

        const addrPreview = this.props.address.slice(0,6) + '...' + this.props.address.slice(-4);

        this.ens.getName(address).then( resp => {
            if( resp.name ) {
                this.setState({ens: resp.name, addressPreview: addrPreview});
            }
            else {
                this.setState({ens: null, addressPreview: addrPreview});
            }
        });
    }

    componentDidMount = () => {
        this.getEns(this.props.address);
    }

    componentDidUpdate(prevProps, prevState) {
        if( prevProps.address !== this.props.address ) {
            this.getEns( this.props.address );
        }
    }


    render() {

        if( this.state.ens ) {
            return (
                <Fragment>
                    <Badge bg="primary">{ Utils.toTitle(this.state.ens) }</Badge>
                    ({this.state.addressPreview})
                </Fragment>
            )
        }
        else {
            return <Fragment>{this.state.addressPreview}</Fragment>
        }
    }
}

export default ENSText;