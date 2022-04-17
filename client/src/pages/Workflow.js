import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import Web3Context from "../store/web3-context";


class Workflow extends Component {

    static contextType = Web3Context;

    state = {
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log(this.props.match.params)
    }

    componentDidUpdate(prevProps, prevState) {


    }

    render() {

        return <h1>Workflow Only owner here !</h1>

    }
}

export default withRouter(Workflow);