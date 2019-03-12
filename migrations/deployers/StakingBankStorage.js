const getConfig = require('../inc/getConfig');

module.exports = (deployer, network, accounts, StakingBankStorageArtifact, HumanStandardTokenArtifacts) => {
  return deployer.then(async () => {
    const { options } = getConfig(network, accounts);

    const token = await HumanStandardTokenArtifacts.deployed();

    return deployer.deploy(
      StakingBankStorageArtifact,
      token.address,
      options,
    );
  });
};
