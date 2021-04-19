const axios = require(`axios`)
const fs = require('fs')
const stringify = require(`json-stringify-safe`)
const httpExceptionHandler = require(`./http-exception-handler`)
const chalk = require('chalk')
const log = console.log
const { digest } = require('./helpers')

async function doFetch(method, url, headers, data, params, auth, reporter, routeData, calculateNextPage) {
  let completeResult = []
  let haveMorePages = false
  let curUrl = url
  let context = {}
  let didPage = false

  do {
    let options = {
      method: method,
      url: curUrl,
      headers: headers,
      data: data,
      params: params
    };
    if (auth) {
      options.auth = auth
    }
    reporter.verbose(`loading from server ${curUrl}`)
    const response = await axios(options)
    reporter.verbose(`got url ${curUrl}`)
    routeData = response.data

    haveMorePages = false // needs to be set to true below
    if (routeData) {
      completeResult.push(routeData)
      if (calculateNextPage) {
        try {
          const nextPage = calculateNextPage(curUrl, response, context);
          if (nextPage.hasNext) {
            didPage = true
            haveMorePages = nextPage.hasNext;
            curUrl = nextPage.url
            reporter.verbose(`have more data, next page ${curUrl}`)
          }
        } catch (e) {
          reporter.error(`error during calculateNextPage for url ${curUrl}`, e)
        }
      }
    }
  } while (haveMorePages)

  return didPage ? completeResult : routeData;
}

async function fetch({
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
  shouldCache,
  maxCacheDurationSeconds,
  calculateNextPage
}) {

  let allRoutes
  let routeData
  const cacheKey = digest(JSON.stringify({
    url: url,
    method: method,
    headers: headers,
    data: data,
    name: name,
    path: path,
    payloadKey: payloadKey,
    auth: auth,
    params: params
  }));
  const timestampKey = `${cacheKey}-timestamp`;

  let useCache = shouldCache;
  if (shouldCache) {
    const cacheTimestamp = await cache.get(timestampKey);
    if (cacheTimestamp) {
      const cacheDate = new Date(cacheTimestamp);
      const cacheMillis = cacheDate.getTime();
      const ageInMillis = Date.now() - cacheMillis;
      useCache = ageInMillis < maxCacheDurationSeconds * 1000;
      if (!useCache) {
        reporter.info(`not using cache as its too old ${ageInMillis / 1000}s`);
      }
    }
  }

  // Attempt to download the data from api
  routeData = useCache && await cache.get(cacheKey)

  if (payloadKey && calculateNextPage) {
    reporter.panic('payloadKey and calculateNextPage currently dont work together yet', new Error('payloadKey and calculateNextPage currently dont work together yet'))
  }
  if (!routeData) {

    try {
      routeData = await doFetch(method, url, headers, data, params, auth, reporter, routeData, calculateNextPage);
      if (shouldCache) {
        await cache.set(cacheKey, routeData)
        await cache.set(timestampKey, new Date().toISOString())
      }
    } catch (e) {
      console.log('\nGatsby Source Api Server response error:\n', e.response.data && e.response.data.errors)
      httpExceptionHandler(e, reporter)
    }
  } else {
    reporter.verbose(`using cached data for ${url}`)
  }

  if (routeData) {
    // console.log(`allRoutes: `, allRoutes.data);

    // Create a local save of the json data in the user selected path
    if(localSave) {
      try {
        fs.writeFileSync(`${path}${name}.json`, stringify(routeData, null, 2))
      } catch(err) {
        reporter.panic(`Plugin ApiServer could not save the file.  Please make sure the folder structure is already in place.`, err)
      }

      if(verbose) {
        log(chalk`{bgCyan.black Plugin ApiServer} ${name}.json was saved locally to ${path}`)
      }
    }

    // Return just the intended data
    if(payloadKey) {
      return routeData[payloadKey]
    }
    return routeData
  }
}

module.exports = fetch
