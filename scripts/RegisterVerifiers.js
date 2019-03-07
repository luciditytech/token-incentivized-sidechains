const BigNumber = require('bignumber.js');
const { mineToStartPurchase } = require('token-sale-contracts/test/inc/helpers');

const VerifierRegistry = artifacts.require('VerifierRegistry');
const StakingBank = artifacts.require('StakingBank');
const Salable = artifacts.require('Salable');


async function createVerifiersList(verifiersAddr, verifierRegistry) {
  const list = [];
  try {
    const mapResults = verifiersAddr.map(async (addr, i) => {
      if (await verifierRegistry.isRegisteredVerifier.call(addr)) return;
      list.push(addr);
      verifierRegistry.create(`name_${i + 1}`, `192.168.1.${i + 1}`, { from: addr });
    });
    await Promise.all(mapResults);
  } catch (e) {
    throw new Error(`[verifiers registration] create fail: ${e.toString()}`);
  }
  return list;
}

async function purchaseTokens(verifiersAddr, verifierRegistry, stakingBank) {
  await mineToStartPurchase();

  const addrAmounts = {};

  const salable = await Salable.at(await stakingBank.token.call());
  const price = await salable.price.call();

  try {
    const mapResults = verifiersAddr.map(async (addr, i) => {
      addrAmounts[addr] = i + 1;
      salable.purchaseTokens({
        from: addr,
        value: BigNumber(price).times(addrAmounts[addr]),
      });
    });
    await Promise.all(mapResults);
  } catch (e) {
    throw new Error(`[verifiers registration] purchaseTokens fail: ${e.toString()}`);
  }

  return addrAmounts;
}

async function approveAndCall(addrAmounts, stakingBank) {
  const salable = await Salable.at(await stakingBank.token.call());

  try {
    const mapResults = [];
    for (const address in addrAmounts) {
      mapResults.push(salable.approveAndCall(stakingBank.address, addrAmounts[address], { from: address }));
    }
    await Promise.all(mapResults);
  } catch (e) {
    throw new Error(`[verifiers registration] approveAndCall fail: ${e.toString()}`);
  }
}

async function verifyStakingTokenBalance(addrAmounts, stakingBank) {
  try {
    const mapResults = [];
    for (const address in addrAmounts) {
      mapResults.push(stakingBank.stakingBalance.call(address));
    }
    const res = await Promise.all(mapResults);
    res.map((balance) => {
      if (balance.toNumber() === 0) {
        throw new Error('[verifiers registration] verifyStakingTokenBalance fail');
      }
      return true;
    });
  } catch (e) {
    throw new Error(`[verifiers registration] verifyTokenBalance fail: ${e.toString()}`);
  }
}

module.exports = async (verifiersAddr) => {
  const registry = await VerifierRegistry.deployed();
  const bank = await StakingBank.deployed();

  const verifiersList = await createVerifiersList(verifiersAddr, registry);
  const addrAmounts = await purchaseTokens(verifiersList, registry, bank);
  await approveAndCall(addrAmounts, bank);
  await verifyStakingTokenBalance(addrAmounts, bank);
};
