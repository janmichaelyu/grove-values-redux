import { combineReducers } from 'redux';
import {
  selectors as executedSelectors,
  createReducer as createExecutedValues
} from './executedValuesQuery';

export const createReducer = config => {
  return combineReducers({
    executedValues: createExecutedValues(config)
  });
};

export default createReducer();

// SELECTORS
const bindSelector = (selector, mountPoint) => {
  return (state, ...args) => {
    return selector(state[mountPoint], ...args);
  };
};

const bindSelectors = (selectors, mountPoint) => {
  return Object.keys(selectors).reduce((bound, key) => {
    bound[key] = bindSelector(selectors[key], mountPoint);
    return bound;
  }, {});
};

export const selectors = {
  ...bindSelectors(executedSelectors, 'executedValues')
};
