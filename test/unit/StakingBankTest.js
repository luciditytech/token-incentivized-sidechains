const BigNumber = require('bignumber.js');
const { mineToStartPurchase } = require('token-sale-contracts/test/inc/helpers');

const deployedStakingBank = require('../inc/deployedStakingBank');

const VerifierRegistry = artifacts.require('VerifierRegistry');
const StakingBank = artifacts.require('StakingBank');
const Chain = artifacts.require('Chain');
const HumanStandardToken = artifacts.require('HumanStandardToken');

const { getNextProposeStartBlock, getNextRevealStartBlock } = require('../inc/chainCycleFunctions');

const {
  takeSnapshot, resetSnapshot, mineBlock, ethBlockNumber,
} = require('../inc/helpers');


function listenForEvent(contract, filter) {
  return new Promise((resolve, reject) => {
    var event = contract[filter.event]();
    event.watch();
    event.get((error, logs) => {
      var log = _.filter(logs, filter);
      if (log) {
        resolve(log);
      } else {
        throw Error("Failed to find filtered event for " + filter.event);
      }
    });
    event.stopWatching();
  });
}
contract('STAKING BALANCE INTEGRATION TEST', (accounts) => {
  let verifierRegistry;
  let stakingBankInstance;
  let ministroStakingBank;
  let token;
  const verifier = accounts[1];

  describe('when verifierRegistry is deployed', async () => {
    before(async () => {
      verifierRegistry = await VerifierRegistry.deployed();
    });

    describe('when stakingBank is deployed', async () => {
      before(async () => {
        ({ ministroStakingBank, stakingBankInstance } = await deployedStakingBank(accounts[0]));
      });

      describe('when Token is deployed', async () => {
        before(async () => {
          token = await HumanStandardToken.deployed();
        });

        it('token address should match', async () => {
          assert.strictEqual(await token.address, await stakingBankInstance.token.call(), 'invalid token address');
        });

        describe('when we have unregistered verifier', async () => {

          before(async () => {
            assert.isFalse(await verifierRegistry.isRegisteredVerifier.call(verifier));
          });

          it('should be possible to register verifier', async () => {
            await verifierRegistry.create('Verifier1', 'Location', { from: verifier });
            assert(await verifierRegistry.isRegisteredVerifier.call(verifier));
          });

          it('should be possible to transfer tokens to verifier', async () => {
            await token.transfer(verifier, 1, { from: accounts[0] });
          });

          it('verifier should have regular token balance', async () => {
            const balance = await token.balanceOf.call(verifier);
            assert(BigNumber(balance).eq(1), 'invalid balance');
          });

          it('verifier should have NO staking balance', async () => {
            const balance = await stakingBankInstance.stakingBalance.call(verifier);
            assert(BigNumber(balance).eq(0), 'invalid staking balance');
          });

          it('should be possible to approveAndCall()', async () => {
            await token.approveAndCall(stakingBankInstance.address, 1, '0x0', { from: verifier });
            //console.log(await listenForEvent(stakingBankInstance, 'Log'));
            //console.log(await listenForEvent(stakingBankInstance, 'LogSig'));
            //console.log(await listenForEvent(stakingBankInstance, 'LogAddr'));
          });

          it('veriefier should have staking balance', async () => {
            const balance = await stakingBankInstance.stakingBalance.call(verifier);
            assert(BigNumber(balance).eq(1), 'invalid staking balance');

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
              await ministroStakingBank.withdraw(1, { from: verifier }, true);
            });

            describe('when revealing phase', async () => {
              before(async () => {
                await mineBlock(getNextRevealStartBlock(await ethBlockNumber(), blocksPerPhase));
                assert.isFalse(await chain.isProposePhase(), 'should be propose');
              });

              it('staking tokens should be unlocked and withdraw should be possible', async () => {
                await ministroStakingBank.withdraw(1, { from: verifier });
              });
            });
          });
        });
      });
    });
  });
});
