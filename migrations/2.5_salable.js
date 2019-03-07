const SalableDeployer = require('token-sale-contracts/migrations/deployers/Salable');

const Salable = artifacts.require('Salable');

module.exports = (deployer, network, accounts) => SalableDeployer(
  deployer, network, accounts, Salable,
);
