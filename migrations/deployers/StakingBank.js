const getConfig = require('../inc/getConfig');

module.exports = (
  deployer,
  network,
  accounts,
  ContractRegistryArtifact,
  StakingBankStorageArtifact,
  StakingBankArtifact,
) => {
  return deployer.then(async () => {
    const { options, config } = getConfig(network, accounts);

    let contractRegistry;
    if (config.contractRegistryAddress) {
      contractRegistry = await ContractRegistryArtifact.at(config.contractRegistryAddress);
    } else {
      contractRegistry = await ContractRegistryArtifact.deployed();
      config.contractRegistryAddress = contractRegistry.address;
    }

    const storage = await StakingBankStorageArtifact.deployed();

    const instance = await deployer.deploy(
      StakingBankArtifact,
      config.contractRegistryAddress,
      storage.address,
      options,
    );

    await storage.initStorageOwner(instance.address);
    await contractRegistry.add(instance.address);
    return instance;
  });
};
