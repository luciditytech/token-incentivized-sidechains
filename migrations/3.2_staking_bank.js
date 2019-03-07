const StakingBankDeployer = require('./deployers/StakingBank');

const ContractRegistry = artifacts.require('ContractRegistry');
const StakingBankStorage = artifacts.require('StakingBankStorage');
const StakingBank = artifacts.require('StakingBank');

module.exports = (deployer, network, accounts) => StakingBankDeployer(
  deployer,
  network,
  accounts,
  ContractRegistry,
  StakingBankStorage,
  StakingBank,
);
