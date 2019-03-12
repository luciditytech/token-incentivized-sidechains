const HumanStandardToken = artifacts.require('HumanStandardToken');

const conf = require('token-sale-contracts/conf/development');

module.exports = (deployer, network, accounts) => {
  deployer.deploy(
    HumanStandardToken,
    conf.total,
    conf.name,
    conf.decimals,
    conf.symbol,
  );
};
