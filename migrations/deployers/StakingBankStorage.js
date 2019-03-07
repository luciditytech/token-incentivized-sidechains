const getConfig = require('../inc/getConfig');

module.exports = (deployer, network, accounts, StakingBankStorageArtifact, SalableArtifacts) => {
  return deployer.then(async () => {
    const { options, config } = getConfig(network, accounts);

    if (!config.token) {
      const salable = await SalableArtifacts.deployed();
      config.token = salable.address;
    }

    return deployer.deploy(
      StakingBankStorageArtifact,
      config.token,
      options,
    );
  });
};
