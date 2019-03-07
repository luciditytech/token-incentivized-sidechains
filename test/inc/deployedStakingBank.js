const StakingBank = artifacts.require('StakingBank');

const StakingBankUtil = require('../ministro-contracts/ministroStakingBank');

module.exports = async (owner) => {
  const stakingBankInstance = await StakingBank.deployed();
  assert.isNotEmpty(stakingBankInstance.address);

  const ministroStakingBank = StakingBankUtil();
  ministroStakingBank.setInstanceVar(stakingBankInstance);
  ministroStakingBank.setFromVar(owner);

  return {
    stakingBankInstance,
    ministroStakingBank,
  };
};
