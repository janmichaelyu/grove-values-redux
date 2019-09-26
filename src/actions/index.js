/* global require */
import * as bareTypes from '../actionTypes';

require('isomorphic-fetch');

const defaultAPI = {
  values: options => {
    return fetch(
      '/v1/config/query/' + (options ? options : 'all') + '?format=json',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'same-origin'
      }
    ).then(
      response => {
        return response.json().then(function (json) {
          let options = json.options || {};

          let path = '';
          let collation = '';
          for (let i = 0; i < options.constraint.length; i++) {
            if (options.constraint[i].name === name) {
              path = options.constraint[i].range['path-index'].text;
              collation = options.constraint[i].range.collation;
            }
          }

          options.values = {
            name: name,
            range: {
              collation: collation,
              type: 'xs:string',
              'path-index': {
                text: path,
                ns: ''
              }
            },
            'values-option': ['frequency-order']
          };
          //combine with values
          let valuesType = 'all';
          // let valuesType = valuesType !== undefined ? valuesType : 'all';
          let start = facetObject.facetValues.length + 1 || 1;
          // let start = 1;
          let pageLength = 10;
          // var limit = 100;
          var limit = start + pageLength - 1;

          let facets = Object.keys(valuesState.activeFacets || {}).map(function (facetName) {
            let constraintType = valuesState.activeFacets[facetName].type;
            if (constraintType && constraintType.substring(0, 3) === 'xs:') {
              constraintType = 'range';
            }
            let temp = {
              'range-constraint-query': {
                'constraint-name': facetName,
                constraintType: constraintType
              }
            };
            valuesState.activeFacets[facetName].values.map(function (facetValue) {
              temp.value = [facetValue.value];
              if (facetValue.negated) {
                temp['range-operator'] = 'NE';
              }
            });

            return temp;
          });
          let valuesParams = new URLValuesParams();
          valuesParams.append('q', qtext);
          valuesParams.append('start', start);
          valuesParams.append('pageLength', pageLength);
          valuesParams.append('limit', limit);
          valuesParams.append('direction', 'descending');
          let valuesParamsString = valuesParams.toString();

          return fetch('/v1/values/' + name + '?' + valuesParamsString, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              values: {
                query: {
                  queries: {
                    and: [].concat(facets)
                  }
                },
                options: options
              }
            }),
            credentials: 'same-origin'
          }).then(
            response => {
              return response.json().then(function (json) {

                return {response: json};
              });
            },
            error => {
              return error;
            }
          );
        });
      },
      error => {
        return error;
      }
    );
  }
};

export default config => {
  let types = bareTypes;
  if (config && config.namespace) {
    types = Object.keys(types).reduce((newTypes, typeKey) => {
      newTypes[typeKey] = config.namespace + '/' + types[typeKey];
      return newTypes;
    }, {});
  }

  const receiveSuccessfulValues = (response, optionalArgs) => ({
    type: types.VALUES_SUCCESS,
    payload: {response, ...optionalArgs}
  });

  const runValues = (valuesQuery, optionalArgs = {}) => {
    let valuesAPI = defaultAPI;
    if (optionalArgs.api) {
      valuesAPI = optionalArgs.api;
      delete optionalArgs.api;
    }
    return dispatch => {
      dispatch({
        type: types.VALUES_REQUESTED,
        payload: {query: valuesQuery, ...optionalArgs}
      });

      // TODO: consider changing shape of state instead of modifying
      // shape of query here
      const {page, pageLength, ...groveValuesQuery} = valuesQuery;
      return valuesAPI
        .values(
          {
            ...groveValuesQuery,
            options: {
              start:
                pageLength && page ? pageLength * (page - 1) + 1 : undefined,
              pageLength: pageLength
            }
          },
          optionalArgs
        )
        .then(
          data => dispatch(receiveSuccessfulValues(data, optionalArgs)),
          error => {
            dispatch({
              type: types.VALUES_FAILURE,
              payload: {error: error.message, ...optionalArgs}
            });
          }
        );
    };
  };

  const clearValuesResults = (optionalArgs = {}) => ({
    type: types.CLEAR_VALUES_RESULTS,
    payload: {...optionalArgs}
  });


  const setQueryText = queryText => {
    return {
      type: types.SET_QUERYTEXT,
      payload: {queryText}
    };
  };

  const changePage = n => {
    return {type: types.CHANGE_PAGE, payload: {page: n}};
  };

  const addFilter = (constraint, constraintType, values, optional = {}) => {
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_ADD,
      payload: {
        constraint,
        constraintType: constraintType || undefined,
        values,
        boolean: optional.boolean || 'and'
      }
    };
  };

  const removeFilter = (constraint, values, optional = {}) => {
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_REMOVE,
      payload: {constraint, values, boolean: optional.boolean || 'and'}
    };
  };

  const clearFilter = (constraint, optional = {}) => ({
    type: types.FILTER_CLEAR,
    payload: {constraint, ...optional}
  });

  const replaceFilter = (constraint, constraintType, values, optional = {}) => {
    // TODO: DRY UP with addFilter?
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_REPLACE,
      payload: {
        constraint,
        constraintType: constraintType || undefined,
        values,
        boolean: optional.boolean || 'and'
      }
    };
  };

  return {
    runValues,
    receiveSuccessfulValues,
    clearValuesResults,
    setQueryText,
    changePage,
    addFilter,
    removeFilter,
    replaceFilter,
    clearFilter
  };
};
