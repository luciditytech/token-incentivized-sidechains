const BigNumber = require('bignumber.js');
const deployedStakingBank = require('../inc/deployedStakingBank');

const {
  takeSnapshot, resetSnapshot, mineBlock, ethBlockNumber,
} = require('../inc/helpers');

const { getNextProposeStartBlock, getNextRevealStartBlock } = require('../inc/chainCycleFunctions');

const Chain = artifacts.require('Chain');

const RegisterVerifiers = require('../../scripts/RegisterVerifiers');

contract('STAKING BANK', (accounts) => {
  let ministroStakingBank;
  let snapshotId;
  const verifiers = [accounts[1], accounts[2]];
  let verifiersStakingBalances;

  before(async () => {
    snapshotId = await takeSnapshot();
    ({ ministroStakingBank } = await deployedStakingBank(accounts[0]));
  });

  after(async () => {
    await resetSnapshot(snapshotId);
  });

  describe('when the contract was deployed', async () => {
    it('verifiers should have valid initial staking balance', async () => {
      assert(BigNumber(await ministroStakingBank.stakingBalance(verifiers[0])).eq(0), 'invalid balance for verifier1');
      assert(BigNumber(await ministroStakingBank.stakingBalance(verifiers[1])).eq(0), 'invalid balance for verifier2');
    });

    describe('when verifiers are registered', async () => {
      before(async () => {
        await RegisterVerifiers(verifiers);
      });

      it('verifiers should have staking balance', async () => {
        verifiersStakingBalances = [
          await ministroStakingBank.stakingBalance(verifiers[0]),
          await ministroStakingBank.stakingBalance(verifiers[1]),
        ];
        assert(BigNumber(verifiersStakingBalances[0]).gt(0), 'invalid balance for verifier1');
        assert(BigNumber(verifiersStakingBalances[1]).gt(0), 'invalid balance for verifier2');
      });

      describe('when proposing phase', async () => {
        let chain;
        let blocksPerPhase;

        before(async () => {
          chain = await Chain.deployed();
          blocksPerPhase = await chain.blocksPerPhase.call();
          await mineBlock(getNextProposeStartBlock(await ethBlockNumber(), blocksPerPhase));
          assert(await chain.isProposePhase(), 'should be propose');
        });
        it('staking tokens should be locked and withdraw should throw', async () => {
          await ministroStakingBank.withdraw(
            verifiersStakingBalances[0], { from: verifiers[0] }, true,
          );
          await ministroStakingBank.withdraw(
            verifiersStakingBalances[1], { from: verifiers[1] }, true,
          );
        });

        describe('when revealing phase', async () => {
          before(async () => {
            await mineBlock(getNextRevealStartBlock(await ethBlockNumber(), blocksPerPhase));
            assert.isFalse(await chain.isProposePhase(), 'should be propose');
          });
          it('staking tokens should be unlocked and withdraw should be possible', async () => {
            await ministroStakingBank.withdraw(
              verifiersStakingBalances[0], { from: verifiers[0] },
            );
            await ministroStakingBank.withdraw(
              verifiersStakingBalances[1], { from: verifiers[1] },
            );
          });
        });
      });
    });
  });
});
