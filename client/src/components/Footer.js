import React, {Component} from "react";
import {Container, Navbar} from "react-bootstrap";
import Web3Context from "../store/web3-context";

class Footer extends Component {

    static contextType = Web3Context;

    constructor(props) {
        super(props);
        this.state = {blockNumber: ''};
    }

    componentDidMount = async () => {

        await this.getBlock();

        this.blockTimer = setInterval(
            () => this.getBlock(),
            2000
        );
    }

    componentWillUnmount() {
        clearInterval(this.blockTimer);
    }

    async getBlock() {

        if( this.context.web3 ) {

            const bn = await this.context.web3.eth.getBlockNumber();
            this.setState({
                blockNumber: bn
            });
        }
    }

    render() {
        return (
            <Navbar expand="lg" fixed="bottom">
                <Container>
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text>
                            Block {this.state.blockNumber}
                        </Navbar.Text>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        );
    }

}

export default Footer;