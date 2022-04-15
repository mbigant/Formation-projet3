import React, {Component} from "react";
import {Container, Nav, Navbar, NavDropdown} from "react-bootstrap";

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
        console.log('componentDidUpdate')
    }

    render() {

        console.log('render');
        console.log(this.context.accounts[0]);
        console.log(this.context.owner);
        console.log(this.context.accounts[0] === this.context.owner);

        return (
            <Navbar bg="light" expand="lg" fixed="top" className="header">
                <Container>
                    <Navbar.Brand href="#home">Vote 3.0</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#home">Home</Nav.Link>
                            {
                                (this.context.accounts.length > 0 && this.context.accounts[0].toLowerCase() === this.context.owner)  &&
                                // Only owner
                                <NavDropdown title="Administration" id="basic-nav-dropdown">
                                    <NavDropdown.Item href="#action/3.1">
                                        <NavLink to='/voters'>Votants</NavLink>
                                    </NavDropdown.Item>
                                    <NavDropdown.Item href="#action/3.2">Workflow</NavDropdown.Item>
                                    <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                                </NavDropdown>
                            }
                        </Nav>

                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text>
                                { this.context.accounts.length > 0 ? <ENSText address={this.context.accounts[0]} /> : 'Not connected' }
                            </Navbar.Text>
                        </Navbar.Collapse>

                    </Navbar.Collapse>
                </Container>
            </Navbar>
        );
    }

}

export default Header;