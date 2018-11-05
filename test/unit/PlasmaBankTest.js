import { assert, expect } from 'chai';
import { assertRevert } from 'openzeppelin-solidity/test/helpers/assertRevert';
import web3Utils from 'web3-utils';

const SparseMerkleTree = require('../../lib/SparseMerkleTree');
const BN = require('bn.js');
const TestHelper = require('../helpers/TestHelper');

const { sha3, sha256, bufferToHex } = require('ethereumjs-util');

const PlasmaBank = artifacts.require('PlasmaBank');
const HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');
const Chain = artifacts.require('./Chain.sol');
const VerifierRegistry = artifacts.require('./VerifierRegistry.sol');

var getBalanceOf = function(tokenAddress, accountAddress) {
  var promise = new Promise(function(resolve, reject) {
    HumanStandardToken
      .at(tokenAddress)
      .then(function(token) {
        return token.balanceOf.call(accountAddress)
      })
      .then(function (result) {
        resolve(result.toNumber());
      })
      .catch(function(err) { 
        reject(new Error(err));
      });
  });

  return promise;
};

contract ('PlasmaBank', (accounts) => {
  describe('#exit()', () => {
    let bank;
    let token;
    let registry;
    let chain;

    let snapshotId;
    let blocksPerPhase = 8;

    beforeEach(async () => {
      snapshotId = await TestHelper.takeSnapshot();

      token = await HumanStandardToken.new(
        1000,
        "Test Token",
        9,
        "TST"
      );
    });

    afterEach(async () => {
      await TestHelper.resetSnapshot(snapshotId);
    });

    describe("when there is a registry setup", () => {
      let registry;

      beforeEach(async () => {
        // setup registry
        registry = await VerifierRegistry.new(1);

        await registry.create(
          "127.0.0.1",
          accounts[0],
          true
        );
      });

      describe("when there is a staked chain setup", () => {
        let chain;
        let stake = new BN('50', 10);

        beforeEach(async () => {
          chain = await Chain.new(
            token.address,
            registry.address,
            blocksPerPhase
          );

          var stakingBankAddress = await chain.stakingBank();
          
          await token.approveAndCall(
            stakingBankAddress,
            stake.toNumber(),
            null,
            {
              from: accounts[0]
            }
          );

          var staked = await getBalanceOf(token.address, stakingBankAddress);
          assert(staked === stake.toNumber());
        });

        describe("when there is a bank setup", () => {
          let bank;

          beforeEach(async () => {
            bank = await PlasmaBank.new(
              token.address,
              chain.address
            );
          });

          describe("when there is a bank deposit", () => {
            let deposit = new BN('50', 10);

            beforeEach(async () => {
              await token.approveAndCall(
                bank.address,
                deposit.toNumber(),
                null,
                {
                  from: accounts[0]
                }
              );

              var bankBalance = await getBalanceOf(token.address, bank.address);
              assert(bankBalance === deposit.toNumber());
            });

            describe("when there is a valid consensus root", () => {
              let merkleTree;
              let secret;
              let index = accounts[0];

              beforeEach(async () => {
                // mine until it's time to propose a new merkle root
                if (await chain.getCurrentElectionCycleBlock() >= blocksPerPhase) {
                  var block = await web3.eth.getBlock("latest");
                  var blocksToMine = new BN(block.number, 10).add(new BN(blocksPerPhase, 10));
                  await TestHelper.mineBlock(blocksToMine);
                }

                // setup the merkle tree for the consensus root
                let treeData = {};
                const rawLeafValue = web3Utils.soliditySha3(deposit.toNumber());
                const leafValue = new Buffer(rawLeafValue.substr(2), 'hex');

                treeData[index] = leafValue;

                merkleTree = new SparseMerkleTree(treeData, 4);

                // submit a blind proposal of the merkle root
                var proposal = merkleTree.getHexRoot();
                secret = web3Utils.soliditySha3(0x0);

                var blindedProposal = web3Utils.soliditySha3(
                  proposal,
                  secret
                );

                await chain.propose(
                  blindedProposal,
                  {
                    from: accounts[0]
                  }
                );

                // mine until it's time reveal our committed proposal
                if (await chain.getCurrentElectionCycleBlock() < blocksPerPhase) {
                  var block = await web3.eth.getBlock("latest");
                  var blocksToMine = new BN(block.number, 10).add(new BN(blocksPerPhase, 10));
                  await TestHelper.mineBlock(blocksToMine);
                }

                // reveal the secret and original merkle root
                await chain.reveal(
                  proposal,
                  secret,
                  {
                    from: accounts[0]
                  }
                );

                // assert that the consensus root is the proposed merkle root
                var blockHeight = await chain.getBlockHeight();
                var lastBlockRoot = await chain.getBlockRoot(blockHeight, 0);
                assert(lastBlockRoot == proposal);
              });

              it('client generated the correct proof', async () => {
                // const leafValue = sha3(deposit.toNumber());
                const rawLeafValue = web3Utils.soliditySha3(deposit.toNumber());
                const leafValue = new Buffer(rawLeafValue.substr(2), 'hex');

                const proof = merkleTree.getProofForIndex(index);

                expect(
                  merkleTree.verifyProof(
                    proof,
                    merkleTree.getRoot(),
                    leafValue,
                    index
                  )
                ).to.equal(true);
              });

              it('verifies the correct proof', async () => {
                const proof = merkleTree.getHexProofForIndex(index);

                // const leafValue = bufferToHex(sha3(deposit.toNumber()));

                const rawLeafValue = web3Utils.soliditySha3(deposit.toNumber());
                const leafValue = new Buffer(rawLeafValue.substr(2), 'hex');

                const res = await bank.verifyProof(
                  proof,
                  merkleTree.getHexRoot(),
                  bufferToHex(leafValue),
                  index
                );

                assert(res);
              });

              it('exits with the correct amount of tokens', async () => {
                const proof = merkleTree.getHexProofForIndex(index);

                const rawLeafValue = web3Utils.soliditySha3(deposit.toNumber());
                const leafValue = new Buffer(rawLeafValue.substr(2), 'hex');

                const test = web3Utils.soliditySha3(deposit.toNumber());

                console.log('leafValue = ' + bufferToHex(leafValue));
                console.log('test      = ' + test);

                await bank.exit(
                  0,
                  deposit.toNumber(),
                  proof,
                  index,
                  bufferToHex(leafValue),
                  {
                    from: accounts[0]
                  }
                );
              });
            });
          });
        });
      });
    });
  });
});
