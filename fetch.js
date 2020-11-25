let doFetch = (() => {
  var _ref = _asyncToGenerator(function* (method, url, headers, data, params, auth, reporter, routeData, calculateNextPage) {
    let completeResult = [];
    let haveMorePages = false;
    let curUrl = url;
    let context = {};
    let didPage = false;

    do {
      let options = {
        method: method,
        url: curUrl,
        headers: headers,
        data: data,
        params: params
      };
      if (auth) {
        options.auth = auth;
      }
      reporter.verbose(`loading from server ${curUrl}`);
      const response = yield axios(options);
      reporter.verbose(`got url ${curUrl}`);
      routeData = response.data;

      haveMorePages = false; // needs to be set to true below
      if (routeData) {
        completeResult.push(routeData);
        if (calculateNextPage) {
          try {
            const nextPage = calculateNextPage(curUrl, response, context);
            if (nextPage.hasNext) {
              didPage = true;
              haveMorePages = nextPage.hasNext;
              curUrl = nextPage.url;
              reporter.verbose(`have more data, next page ${curUrl}`);
            }
          } catch (e) {
            reporter.error(`error during calculateNextPage for url ${curUrl}`, e);
          }
        }
      }
    } while (haveMorePages);

    return didPage ? completeResult : routeData;
  });

  return function doFetch(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8, _x9) {
    return _ref.apply(this, arguments);
  };
})();

let fetch = (() => {
  var _ref2 = _asyncToGenerator(function* ({
    url,
    method,
    headers,
    data,
    name,
    localSave,
    path,
    payloadKey,
    auth,
    params,
    verbose,
    reporter,
    cache,
    useCache,
    shouldCache,
    maxCacheDurationSeconds,
    calculateNextPage
  }) {

    let allRoutes;
    let routeData;

    // Attempt to download the data from api
    routeData = useCache && (yield cache.get(url));

    if (payloadKey && calculateNextPage) {
      reporter.panic('payloadKey and calculateNextPage currently dont work together yet', new Error('payloadKey and calculateNextPage currently dont work together yet'));
    }
    if (!routeData) {

      try {
        routeData = yield doFetch(method, url, headers, data, params, auth, reporter, routeData, calculateNextPage);
        if (shouldCache) {
          yield cache.set(url, routeData);
          yield cache.set('cacheTimestamp', new Date().toISOString());
        }
      } catch (e) {
        console.log('\nGatsby Source Api Server response error:\n', e.response.data && e.response.data.errors);
        httpExceptionHandler(e, reporter);
      }
    } else {
      reporter.verbose(`using cached data for ${url}`);
    }

    if (routeData) {
      // console.log(`allRoutes: `, allRoutes.data);

      // Create a local save of the json data in the user selected path
      if (localSave) {
        try {
          fs.writeFileSync(`${path}${name}.json`, stringify(routeData, null, 2));
        } catch (err) {
          reporter.panic(`Plugin ApiServer could not save the file.  Please make sure the folder structure is already in place.`, err);
        }

        if (verbose) {
          log(chalk`{bgCyan.black Plugin ApiServer} ${name}.json was saved locally to ${path}`);
        }
      }

      // Return just the intended data
      if (payloadKey) {
        return routeData[payloadKey];
      }
      return routeData;
    }
  });

  return function fetch(_x10) {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const axios = require(`axios`);
const fs = require('fs');
const stringify = require(`json-stringify-safe`);
const httpExceptionHandler = require(`./http-exception-handler`);
const chalk = require('chalk');
const log = console.log;

module.exports = fetch;