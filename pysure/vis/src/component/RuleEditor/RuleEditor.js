import {connect} from "react-redux";

const RuleEditor = ( props ) => {
    return [];
}

function mapStateToProps(state) {
    return {
        selected_rule: state.selected_rule,
    };
}

export default connect(mapStateToProps)(RuleEditor);