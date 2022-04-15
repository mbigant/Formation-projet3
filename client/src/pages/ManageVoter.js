import {Component} from "react";
import {useParams} from "react-router-dom";


class ManageVoter extends Component {

    constructor(props) {
        super(props);

        const param = useParams();
        console.log(param)
    }
}

export default ManageVoter;