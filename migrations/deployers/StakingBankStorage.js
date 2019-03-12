const getConfig = require('../inc/getConfig');

module.exports = (deployer, network, accounts, StakingBankStorageArtifact, SalesArtifacts) => {
  return deployer.then(async () => {
    const { options } = getConfig(network, accounts);

    const sales = await SalesArtifacts.deployed();

    return deployer.deploy(
      StakingBankStorageArtifact,
      await sales.token(),
      options,
    );
  });
};
