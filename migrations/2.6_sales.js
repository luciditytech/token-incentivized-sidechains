const Sales = artifacts.require('Sales');

const conf = require('token-sale-contracts/conf/development');

module.exports = (deployer, network, accounts) => {
  deployer.deploy(
    Sales,
    accounts[0],
    conf.total,
    conf.name,
    conf.decimals,
    conf.symbol,
    conf.price,
    conf.startBlock,
    conf.freezeBlock,
    conf.cap,
    conf.locked,
  );
};
