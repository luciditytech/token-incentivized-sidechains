const VerifierRegistryStorageDeployer = require('digivice/migrations/deployers/VerifierRegistryStorage');

const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');

module.exports = (deployer, network, accounts) => VerifierRegistryStorageDeployer(
  deployer, network, accounts, VerifierRegistryStorage,
);
