import React, {Component} from "react";
import {Badge, Container, Nav, Navbar, NavDropdown} from "react-bootstrap";

import "./header.css";
import {NavLink} from "react-router-dom";
import Web3Context from "../store/web3-context";
import ENSText from "./ENSText";

class Header extends Component {

    static contextType = Web3Context;

    constructor(props) {
        super(props);
    }

    componentDidMount = () => {

    }

    componentDidUpdate(prevProps, prevState) {

    }

    render() {

        return (
            <Navbar bg="light" expand="lg" fixed="top" className="header">
                <Container>
                    <Navbar.Brand href="#home">Voting 3.0</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="/">Vote</Nav.Link>
                            {
                                (this.context.accounts.length > 0 && this.context.accounts[0].toLowerCase() === this.context.owner)  &&
                                // Only owner
                                <NavDropdown title="Admin" id="basic-nav-dropdown">
                                    <NavLink to='/admin/voters' activeClassName="active" >Voters</NavLink>
                                    <NavLink to='/admin/workflow' activeClassName="active" >Workflow</NavLink>
                                </NavDropdown>
                            }
                        </Nav>

                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text>
                                { this.context.accounts.length > 0 ? <ENSText address={this.context.accounts[0]} /> : <Badge bg="danger">Not connected</Badge> }
                            </Navbar.Text>
                        </Navbar.Collapse>

                    </Navbar.Collapse>
                </Container>
            </Navbar>
        );
    }

}

export default Header;