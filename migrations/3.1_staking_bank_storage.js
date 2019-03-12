const StakingBankStorageDeployer = require('./deployers/StakingBankStorage');

const StakingBankStorage = artifacts.require('StakingBankStorage');
const HumanStandardToken = artifacts.require('HumanStandardToken');

module.exports = (deployer, network, accounts) => StakingBankStorageDeployer(
  deployer, network, accounts, StakingBankStorage, HumanStandardToken,
);
