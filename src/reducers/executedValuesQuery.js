import * as bareTypes from '../actionTypes';

export const createReducer = config => {
  let types = bareTypes;
  if (config && config.namespace) {
    types = Object.keys(types).reduce((newTypes, typeKey) => {
      newTypes[typeKey] = config.namespace + '/' + types[typeKey];
      return newTypes;
    }, {});
  }
  return (state = {}, action) => {
    switch (action.type) {
      case types.VALUES_REQUESTED:
        return {
          ...state,
          id: Math.random()
            .toString()
            .substr(2, 10),
          pending: true,
          // response: {
          //   results: [],
          //   // facets: {},
          //   error: undefined
          // },
          query: { ...action.payload.query }
        };
      case types.VALUES_SUCCESS: {
        const response = action.payload.response;
        let executionTime = response.metrics && response.metrics['total-time'];
        if (executionTime) {
          executionTime = parseFloat(
            executionTime.replace(/^PT/, '').replace(/S$/, '')
          );
        }
        return {
          ...state,
          pending: false,
          response: {
            results: response.results,
            facets: response.facets,
            metadata: {
              executionTime,
              total: response.total
            }
          }
        };
      }
      case types.VALUES_FAILURE:
        return {
          ...state,
          pending: false,
          response: {
            ...state.response,
            error: action.payload && action.payload.error
          }
        };
      case types.CLEAR_VALUES_RESULTS:
        return {};
      default:
        return state;
    }
  };
};

// SELECTORS
const getExecutedValuesQuery = state => {
  return state && state.query;
};
const getValuesResponse = state => {
  return state && state.response;
};

// TODO: clean up this clear anti-pattern
const getFromExecutedValues = (state, propertyName) => {
  return state && state[propertyName];
};
const getFromExecutedValuesQuery = (state, propertyName) => {
  const query = getExecutedValuesQuery(state);
  return query && query[propertyName];
};
const getFromValuesResponse = (state, propertyName) => {
  const response = getValuesResponse(state);
  return response && response[propertyName];
};
const getFromValuesResponseMetadata = (state, propertyName) => {
  const metadata = getFromValuesResponse(state, 'metadata');
  return metadata && metadata[propertyName];
};

const getValuesTotal = state => getFromValuesResponseMetadata(state, 'total');

const getPageLength = state => getFromExecutedValuesQuery(state, 'pageLength');
const isValuesPending = state =>
  getFromExecutedValues(state, 'pending') || false;

export const selectors = {
  // Executed values bookkeeping
  getExecutedValues: state => state,
  getExecutedValuesId: state => state.id,
  isValuesPending: isValuesPending,

  // From executed values query
  getExecutedValuesQuery: getExecutedValuesQuery,
  getPage: state => getFromExecutedValuesQuery(state, 'page'),
  getPageLength: getPageLength,
  getExecutedValuesQueryText: state =>
    getFromExecutedValuesQuery(state, 'queryText'),

  // From values response
  // getValuesResponse: getValuesResponse,
  getValuesResults: state => getFromValuesResponse(state, 'results') || [],
  valuesFacets: state => getFromValuesResponse(state, 'facets'),
  getValuesTotal: getValuesTotal,
  getValuesExecutionTime: state =>
    getFromValuesResponseMetadata(state, 'executionTime'),
  getValuesError: state => getFromValuesResponse(state, 'error'),

  // Calculated
  getValuesTotalPages: state =>
    Math.ceil(getValuesTotal(state) / getPageLength(state)),
  // TODO: test
  isValuesComplete: state => state.response && !isValuesPending(state)
};
