import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { fetchPhase } from '../../../actions/userActions';
import Header from '../index.jsx';
import CubeLoader from '../../Decorative/CubeLoader/CubeLoader';

require('./_index.scss');

class AdminHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentWillMount() {
    this.props.$fetchPhase();
  }

  render() {
    return (
      <div>
        <Header>
          <span className="user-type-view-link">
            {
              this.props.isDetermined &&
              this.props.userType === 'administrator' &&
              (location.hash.indexOf('#/admin') === -1) &&
              <Link to="/admin">Administrator view</Link>
            }
            {
              this.props.isDetermined &&
              this.props.userType === 'jury' &&
              (location.hash.indexOf('#/jury') === -1) &&
              <Link to="/jury">Vote</Link>
            }
          </span>

          <span className="admin-header-period">
            <span className="period">Period:</span>
            { this.props.isFetching && <CubeLoader /> }

            {
              !this.props.isFetching && !this.props.phaseError &&
              <span>{this.props.phases[this.props.phase]}</span>
            }

            {
              !this.props.isFetching &&
              this.props.phaseError &&
              <span>{this.props.phaseError}</span>
            }
          </span>
        </Header>
      </div>
    );
  }
}

AdminHeader.propTypes = {
  isDetermined: PropTypes.bool.isRequired,
  userType: PropTypes.string.isRequired,
  phase: PropTypes.number.isRequired,
  $fetchPhase: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  phaseError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  phases: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
  isDetermined: state.user.isDetermined,
  userType: state.user.type,
  phase: state.user.phase,
  isFetching: state.user.isFetching,
  phaseError: state.user.phaseError,
  phases: state.user.phases
});

export default connect(mapStateToProps, { $fetchPhase: fetchPhase })(AdminHeader);

