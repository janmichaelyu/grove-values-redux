# MarkLogic Search Implemented in Redux

This is a Redux implementation of search. It forms part of the MarkLogic Grove project. It works well for search against MarkLogic, but any backend search system could be used, so long as a middle-tier marshalled the response into the shape specified by the [Grove Core API](https://github.com/marklogic-community/grove-core-api). See the [Grove React-Redux Template](https://github.com/marklogic-community/grove-react-template) for an example of using this library in practice.

## Install

    npm install @marklogic-community/grove-values-redux --save

## Use

### Simple Use

In many cases, you will consume this library as part of a Grove Template, such as the [Grove React-Redux Template](https://github.com/marklogic-community/grove-react-template). The ui library in those templates, in turn, consume this library via the [grove-core-react-redux-containers library](https://github.com/marklogic-community/grove-core-react-redux-containers), which connects together React components with Redux modules like this one.

But the actions and selectors exposed by this library should also be passed along via grove-core-react-redux-containers's `<SearchContainer>`.

TODO: link to information in grove-cli about search filters.

#### Actions

- `runSearch(query)`. Runs a search based on the passed query. The query will most often be obtained by calling `selectors.getStagedQuery(state)`.
- `setQueryText(queryText)`. This sets a queryText filter in the staged search query.
- `addFilter(constraintName, constraintType, values, optional)`. This will by default append filter values with the given constraintName and a mode of 'and' in the staged search query. You can alternatively append to filter values with a mode of 'or' by passing `{boolean: 'or'}` as part of the `optional` argument. Note that values can be a single value or an array of values.
- `replaceFilter(constraintName, constraintType, values, optional)`: This will by default add or replace filter values with the given constraintName and a mode of 'and' in the staged search query. You can alternatively replace those with a mode of 'or' by passing `{boolean: 'or'}` as part of the `optional` argument. Note that values can be a single value or an array of values.
- `removeFilter(constraintName, values, optional)`. This will by default remove filter values with the given constraintName and a mode of 'and' in the staged search query. You can alternatively remove filter values with a mode of 'or' by passing `{boolean: 'or'}` as part of the `optional` argument. Note that values can be a single value or an array of values.
- `clearFilter(constraintName)`. This clears all filters for a given constraintName in the staged search query.
- `changePage(pageNumber)`. Changes the page in the staged search query.

#### Selectors

- Selectors getting information about the **staged** search:
  - `getStagedQuery(state)`. Returns the currently staged query, as serialized in this Redux module and POSTed to a Grove middle-tier.
  - `stagedFilters(state)`. Returns all currently staged filters, as serialized in this Redux module and POSTed to a Grove middle-tier.
  - TODO: more, see `src/reducers/stagedSearch.js`
- Selectors getting information about the **executed** search:
  - `getPage(state)`. Returns the page of the executed search query.
  - `getPageLength(state)`. Returns the page length of the executed search query.
  - TODO: more, see `src/reducers/executedSearch.js`

### Advanced Use Cases

The provided selectors only know about their slice of state, so your consuming code needs to wrap them to provide their particular slice of state. For example:

```javascript
import {
  actions as searchActions,
  selectors as searchSelectors
} from 'grove-values-redux';

const bindSelector = (selector, mountPoint) => {
  return (state, ...args) => {
    return selector(state[mountPoint], ...args)
  }
}
const bindSelectors = (selectors, mountPoint) => {
  return Object.keys(selectors).reduce((bound, key) => {
    bound[key] = bindSelector(selectors[key], mountPoint)
    return bound
  }, {})
}

const boundSearchSelectors = bindSelectors(searchSelectors, 'search');
```

A version of the `bindSelectors()` function is available as an export from the `grove-core-react-redux-containers` library, in case you are already using it.

Also, you will need to provide a searchQuery to the `runSearch` action. This is done for you already if you are using the default ML-Treehouse React components. In other cases, this can be done with something like:

```javascript
import { searchActions } from 'grove-values-redux';

// Using `wrappedSearchSelectors` from the code above
// `state` imported most likely using the React-Redux Provider
searchActions.runSearch(wrappedSearchSelectors.getStagedQuery(state));
```

## 'Ducks' architecture

This roughly follows [the architecture laid out in the re-ducks proposal]( https://github.com/alexnm/re-ducks/blob/f28ecc59d43542b8353948ede0cd3a059ca177dd/README.md):

Specifically, the actionCreators and selectors are the primary external UI. State and reducers should be an implementation detail.

## Contributing

You will need to install the devDependencies:

    npm install

### Building

This project uses [Webpack](https://webpack.js.org/) for building.

    npm run build

### Testing

This project uses [Jest](https://facebook.github.io/jest/) for testing.

    npm test

Or, if you want it to watch for file changes and automatically re-run the tests:

    npm run test:watch

### Linting

This project uses the [Javascript Standard Style](https://standardjs.com/). It will be checked automatically when you run tests, but you will have a greatly improved experience if you [install an ESLint checker in your text editor](https://eslint.org/docs/user-guide/integrations#editors), so linting errors are highlighted immediately.
