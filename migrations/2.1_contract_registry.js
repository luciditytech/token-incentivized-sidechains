const ContractRegistryDeployer = require('contract-registry/migrations/deployment/ContractRegistry');

const ContractRegistry = artifacts.require('ContractRegistry');

module.exports = deployer => ContractRegistryDeployer(deployer, ContractRegistry);
