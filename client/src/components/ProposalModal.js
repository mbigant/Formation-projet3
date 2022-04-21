import React, {Component, Fragment} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import ReactDOM from "react-dom";

const ModalContent = (props) => {
    return (
        <Modal show={props.show} onHide={props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>New proposal</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} onChange={props.onDescriptionChanged}/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={props.onSubmit} disabled={props.disabled}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

class ProposalModal extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Fragment>
                {
                    ReactDOM.createPortal(
                        <ModalContent
                            show={this.props.show}
                            onHide={this.props.onHide}
                            onSubmit={this.props.onSubmit}
                            onDescriptionChanged={this.props.onDescriptionChanged}
                            disabled={this.props.disabled}
                        />,
                        document.getElementById('modal-root'))
                }
            </Fragment>
        )
    }
}

export default ProposalModal;