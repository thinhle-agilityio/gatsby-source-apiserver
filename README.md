# gatsby-source-apiserver

A gatsby source plugin for pulling in third party api data.

## Features

- Pulls data from configured api url
- Uses custom name to allow for multiple instances of plugin
- Option to download the json data to a configurable path
- Option to only download the json data, and skip inserting it into GraphQL
- Supports simple authentication through axios

## Install

```
npm install --save gatsby-source-apiserver
```

Migrate for Gatsby-v2 release:

Please checkout version `2.0.0` or `next`

```
npm install --save gatsby-source-apiserver@next
```

## Change logs

- `2.1.2`:
  - Upgrade axios to 0.19.0 to fix DoS vulnerability
  - Fix multiple deprecation warnings
  - Ran `npm audit fix` to take care of audit warnings
- `2.1.1`:
  - Support multiple entities for multiple api servers, pls take a look at attribute `entitiesArray`
  - Add request params
  - Support Auth0
- `2.0.0`: Support gatsby-v2

## How to use

```javascript
// Place configuration options in your gatsby-config.js

plugins: [
  {
    resolve: "gatsby-source-apiserver",
    options: {
      // Type prefix of entities from server
      typePrefix: "internal__",

      // The url, this should be the endpoint you are attempting to pull data from
      url: `http://yourapi.com/api/v1/posts`,

      method: "post",

      headers: {
        "Content-Type": "application/json"
      },

      // Request body
      data: {},

      // Name of the data to be downloaded.  Will show in graphQL or be saved to a file
      // using this name. i.e. posts.json
      name: `posts`,

      // Nested level of entities in response object, example: `data.posts`
      entityLevel: `data.posts`,

      // Define schemaType to normalize blank values
      // example:
      // const postType = {
      //   id: 1,
      //   name: 'String',
      //   published: true,
      //   object: {a: 1, b: '2', c: false},
      //   array: [{a: 1, b: '2', c: false}]
      // }
      schemaType: postType,

      // Request parameters
      // Only available from version 2.1.0
      params: {
        per_page: 1
      },

      // Simple authentication, optional
      auth: {
        username: "myusername",
        password: "supersecretpassword1234"
      },

      // Advanced authentication for Auth0
      // Only available from version 2.1.0
      auth0Config: {
        method: "POST",
        url: "https://MyAuth0Domain/oauth/token",
        headers: { "content-type": "application/json" },
        data: {
          grant_type: "password",
          username: "myusername",
          password: "PassAWordHere",
          audience: "Auth0APIAudience",
          scope: "openid",
          client_id: "AUTH0_CLIENT_ID",
          client_secret: "AUTH0_SECRET"
        },
        json: true
      },

      // Optional payload key name if your api returns your payload in a different key
      // Default will use the full response from the http request of the url
      payloadKey: `body`,

      // Optionally save the JSON data to a file locally
      // Default is false
      localSave: false,

      //  Required folder path where the data should be saved if using localSave option
      //  This folder must already exist
      path: `${__dirname}/src/data/auth/`,

      // Optionally include some output when building
      // Default is false
      verboseOutput: true, // For debugging purposes

      // Optionally skip creating nodes in graphQL.  Use this if you only want
      // The data to be saved locally
      // Default is false
      skipCreateNode: false, // skip import to graphQL, only use if localSave is all you want

      // Pass an array containing any number of the entity configuration properties (except verbose, auth0Config),
      // any not specified are defaulted to the general properties that are specified
      // Only available from version 2.1.0
      entitiesArray: [
        {
          url: `http://yourapi.com/api/v1/posts`,
          method: "post",
          headers: {
            "Content-Type": "application/json"
          },
          name: `posts`
        }
      ]
    }
  }
];
```

## How to query

Data will be available at the following points in GraphQL.

`all<TypePrefix><Name>` or `<TypePrefix><Name>` where `TypePrefix` and `Name` is replaced by the name entered in the
configuration options.

## Dummy Node

This plugin will automatically add a dummy node to initialize Gatsby Graphql Schema, in order to avoid GraphQL errors when some fields are missing.

The dummy node will have `id: 'dummy'` and you will probably want to exclude it from `createPage()`:

```jsx
<ul>
  {data.allPosts.edges
    .filter(({ node }) => node.id !== "dummy")
    .map(({ node }, index) => (
      <li key={index}>{node.name}</li>
    ))}
</ul>
```

or filter it out from your GraphQL query:

```graphql
query {
    internalAllPosts(filter: {id: {ne: "dummy"}}) {
        // ...
    }
}
```

Note: make sure you pass option `schemaType` to make dummy node works.

### Conflicting keys

Some of the returned keys may be transformed if they conflict with restricted keys used for
GraphQL such as the following `['id', 'children', 'parent', 'fields', 'internal']`

These conflicting keys will now show up as `alternative_id`
