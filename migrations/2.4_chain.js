const Chain = artifacts.require('Chain');

const ContractRegistry = artifacts.require('ContractRegistry');

module.exports = (deployer) => {
  return deployer.then(async () => {
    const contractRegistry = await ContractRegistry.deployed();

    const blocksPerPhase = 5;

    const instance = await deployer.deploy(
      Chain,
      contractRegistry.address,
      blocksPerPhase,
    );

    await contractRegistry.add(instance.address);

    return instance;
  });
};
