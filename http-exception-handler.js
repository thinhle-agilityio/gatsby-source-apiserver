const chalk = require('chalk');
const log = console.log;

/**
 * Handles HTTP Exceptions (axios)
 *
 * @param {any} e
 */

function httpExceptionHandler(e, reporter) {
  const { response, code } = e;
  if (!response) {
    log(chalk`{bgRed Plugin ApiServer} The request failed. Error Code: ${code}`);
    return reporter.error(`Plugin ApiServer http request failed. Error Code: ${code}`, e);
  }
  const { status, statusText, data: { message } } = e.response;
  log(chalk`\n{bgRed Plugin ApiServer} The server response was "${status} ${statusText}"`);
  if (message) {
    log(chalk`{bgRed Plugin ApiServer} Inner exception message : "${message}"`);
  }
  return reporter.error(`Plugin ApiServer http request failed. The server response was "${status} ${statusText}"`, e);
}

module.exports = httpExceptionHandler;