const StakingBankStorageDeployer = require('./deployers/StakingBankStorage');

const StakingBankStorage = artifacts.require('StakingBankStorage');
const Sales = artifacts.require('Sales');

module.exports = (deployer, network, accounts) => StakingBankStorageDeployer(
  deployer, network, accounts, StakingBankStorage, Sales,
);
