const StakingBankStorageDeployer = require('./deployers/StakingBankStorage');

const StakingBankStorage = artifacts.require('StakingBankStorage');
const Salable = artifacts.require('Salable');

module.exports = (deployer, network, accounts) => StakingBankStorageDeployer(
  deployer, network, accounts, StakingBankStorage, Salable,
);
