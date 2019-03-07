const VerifierRegistryDeployer = require('digivice/migrations/deployers/VerifierRegistry');

const ContractRegistry = artifacts.require('ContractRegistry');
const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');
const VerifierRegistry = artifacts.require('VerifierRegistry');

module.exports = (deployer, network, accounts) => VerifierRegistryDeployer(
  deployer,
  network,
  accounts,
  ContractRegistry,
  VerifierRegistry,
  VerifierRegistryStorage,
);
