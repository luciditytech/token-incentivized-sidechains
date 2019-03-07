const developmentConfig = require('../../config/development');

module.exports = (network, accounts) => {
  let config;
  let wallet;
  let options = {};

  if (
    network === 'development'
    || network === 'coverage'
  ) {
    config = developmentConfig;
    [wallet] = accounts;
  } else if (network === 'staging') {
    config = developmentConfig;
    ({ wallet } = config);
  } else if (network === 'production') {
    config = {};
    ({ wallet } = config);
  }

  if (wallet) {
    options = { from: wallet };
  }

  return {
    options,
    config,
  };
};
