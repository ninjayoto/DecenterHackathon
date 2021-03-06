import {
  NEW_TEAM,
  TEAM_UP,
  TEAM_DOWN,
  TEAMS_FETCH,
  TEAMS_SUCCESS,
  TEAMS_ERROR,
  ADD_TEAM,
  ADD_TEAM_ERROR,
  ADD_TEAM_SUCCESS,
  VOTE,
  VOTE_SUCCESS,
  VOTE_ERROR
} from './types';
import toggleModal from './modalsActions';

import * as eth from '../modules/ethereumService';

const teamsFormValidator = (values) => {
  const errors = {};

  if (!values.name) errors.name = 'Required';
  if (!values.address) errors.address = 'Required';

  if (values.address && !web3.isAddress(values.address)) errors.address = 'Ethereum address is not valid';

  if (!values.teamMembers) errors.teamMembers = 'Required';

  if (values.teamMembers) {
    const teamMembers = values.teamMembers.split(', ');
    teamMembers.reduce((sum, val) => {
      if (val.indexOf(',') > 0) errors.teamMembers = 'Team members are not correctly separated';
      return sum.concat(`, ${val}`);
    }, '');
  }

  return errors;
};

const submitAddTeamsForm = (team) => (dispatch) => {
  dispatch({ type: ADD_TEAM });

  eth._registerTeam(team.name, team.address, team.teamMembers, !team.excludeFromPrize)
    .then((res) => {
      dispatch({ type: ADD_TEAM_SUCCESS, payload: { team: res } });
      dispatch(toggleModal(location.hash, false));
    })
    .catch((error) => {
      dispatch({ type: ADD_TEAM_ERROR, payload: { addTeamError: error.message.toString() } });
    });
};

const fetchTeams = () => (dispatch) => {
  dispatch({ type: TEAMS_FETCH });

  eth.getTeams()
    .then((res) => {
      dispatch({ type: TEAMS_SUCCESS, teams: res });
    })
    .catch((error) => {
      console.log(error);
      const errorMessage = error.message ? error.message.toString() : error;
      dispatch({
        type: TEAMS_ERROR,
        error: errorMessage
      });
    });
};

const fetchTeamScores = () => (dispatch) => {
  dispatch({ type: TEAMS_FETCH });
  eth.getTeams()
    .then((teams) => {
      eth.getTeamScores()
        .then((events) => {
          let result = {};
          for (let i = 0; i < events.length; i++) {
            let teamAddress = events[i].args.teamAddress;
            let juryMemberName = events[i].args.juryMemberName;
            let points = parseInt(events[i].args.points.toString(10), 10);

            if (result[teamAddress] !== undefined) {
              result[teamAddress].totalScore += points;
              result[teamAddress].scoreBreakdown.push({ juryMemberName, points });
            } else {
              result[teamAddress] = {
                totalScore: points,
                scoreBreakdown: [{
                  juryMemberName,
                  points
                }]
              };
            }
          }

          let teamsWithPoints = teams.map((item) => {
            let score = result[item.args.teamAddress];
            let scoredItem = item;
            scoredItem.args.totalScore = score.totalScore;
            scoredItem.args.scoreBreakdown = score.scoreBreakdown;

            return scoredItem;
          }).sort((a, b) => b.args.totalScore - a.args.totalScore);

          dispatch({ type: TEAMS_SUCCESS, teams: teamsWithPoints });
        })
        .catch((error) => {
          console.log(error);
          const errorMessage = error.message ? error.message.toString() : error;
          console.log(errorMessage);
        });
    })
    .catch(error => console.log(error));
};

const teamsEventListener = () => (dispatch) => {
  eth.TeamRegisteredEvent((error, data) => {
    if (!error) {
      console.log(data);
      dispatch({
        type: NEW_TEAM,
        event: data,
      });
    }
  });
};

const moveTeamUp = (index) => {
  if (index === 0) {
    return {
      type: '',
    };
  }

  return {
    type: TEAM_UP,
    index
  };
};

const moveTeamDown = (index) => (dispatch, getState) => {
  if (index === getState().teams.teams.length - 1) {
    return dispatch({
      type: ''
    });
  }

  return dispatch({
    type: TEAM_DOWN,
    index
  });
};

const vote = (votes) => dispatch => {
  dispatch({ type: VOTE });

  eth._vote(votes)
    .then(data => {
      dispatch({ type: VOTE_SUCCESS });
    })
    .catch(error => {
      dispatch({ type: VOTE_ERROR });
    });
};

module.exports = {
  fetchTeamScores,
  teamsEventListener,
  fetchTeams,
  teamsFormValidator,
  submitAddTeamsForm,
  moveTeamUp,
  moveTeamDown,
  vote,
};
