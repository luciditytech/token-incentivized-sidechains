const fs = require('fs');
const Chain = artifacts.require("./Chain.sol");
const PlasmaBank = artifacts.require('PlasmaBank');
const HumanStandardToken = artifacts.require('HumanStandardToken');

module.exports = function(deployer, network, accounts) {
  let config;
  let wallet;
  let options = {};

  if (
    network === 'development' ||
    network === 'coverage'
  ) {
    config = JSON.parse(fs.readFileSync('./config/development.json'));
    wallet = accounts[0];
  } else if (network === 'staging') {
    config = JSON.parse(fs.readFileSync('./config/staging.json'));
    wallet = config['wallet'];
  } else if (network === 'production') {
    config = JSON.parse(fs.readFileSync('./config/production.json'));
    wallet = config['wallet'];
  }

  let tokenAddress = (config.Chain.tokenAddress || HumanStandardToken.address);
  let chainAddress = (config.PlasmaBank.chainAddress || Chain.address);

  if (wallet) {
    options = { from: wallet };
  }

  deployer.deploy(
    PlasmaBank,
    tokenAddress,
    chainAddress,
    options
  );
};
