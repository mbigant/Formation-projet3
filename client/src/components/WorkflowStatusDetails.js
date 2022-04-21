import React, {Component} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Moment from "react-moment";
import {Button} from "react-bootstrap";

class WorkflowStatusDetail extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className={this.props.statusValue % 2 === 0 ? '' : 'timeline-inverted'}>
                <div className={this.props.statusValue <= this.props.currentWorkflowStatus ? 'timeline-badge success' : 'timeline-badge'}><FontAwesomeIcon icon={this.props.faIcon}/></div>
                <div className="timeline-panel">
                    <div className="timeline-heading">
                        <h4 className="timeline-title">{this.props.title}</h4>
                        <p>
                            <small className="text-muted">
                            { this.props.timestamp ? <Moment parse="X" format="YYYY-MM-DD HH:mm">{this.props.timestamp}</Moment> : 'Soon' }
                            </small>
                        </p>
                    </div>
                    <div className="timeline-body">
                        <p>{this.props.description}</p>
                    </div>
                    {
                        this.props.currentWorkflowStatus === (this.props.statusValue -1) &&
                        <div>
                            <hr/>
                            <div className="btn-group">
                                <Button variant="primary" onClick={this.props.activate}>Activate</Button>
                            </div>
                        </div>
                    }
                </div>
            </li>
        )
    }
}

export default WorkflowStatusDetail;