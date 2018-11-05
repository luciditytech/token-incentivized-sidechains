import { assert, expect } from 'chai';
import { assertRevert } from 'openzeppelin-solidity/test/helpers/assertRevert';
import web3Utils from 'web3-utils';

const SparseMerkleTree = require('../../lib/SparseMerkleTree');
const BN = require('bn.js');
const TestHelper = require('../helpers/TestHelper');

const { sha3, sha256, bufferToHex } = require('ethereumjs-util');

contract ('PlasmaBank', (accounts) => {
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

    describe("when a participant deposits tokens", () => {
      let stake = new BN('50', 10);
      let deposit = new BN('50', 10);

      describe("when there is a valid consensus root in the chain", () => {
        let merkleTree;
        let secret;

        beforeEach(async () => {
          registry = await VerifierRegistry.new(1);

          await registry.create(
            "127.0.0.1",
            accounts[0],
            true
          );

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

          bank = await PlasmaBank.new(
            token.address,
            chain.address
          );

          // make a deposit to the token bank
          await token.approveAndCall(
            bank.address,
            deposit.toNumber(),
            null,
            {
              from: accounts[0]
            }
          );

          if (await chain.getCurrentElectionCycleBlock() >= blocksPerPhase) {
            var block = await web3.eth.getBlock("latest");
            var blocksToMine = new BN(block.number, 10).add(new BN(blocksPerPhase, 10));
            await TestHelper.mineBlock(blocksToMine);
          }

          merkleTree = new SparseMerkleTree({
            1: sha3(Buffer.from("1"))
          }, 4);

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

          if (await chain.getCurrentElectionCycleBlock() < blocksPerPhase) {
            var block = await web3.eth.getBlock("latest");
            var blocksToMine = new BN(block.number, 10).add(new BN(blocksPerPhase, 10));
            await TestHelper.mineBlock(blocksToMine);
          }

          await chain.reveal(
            proposal,
            secret,
            {
              from: accounts[0]
            }
          );

          var blockHeight = await chain.getBlockHeight();
          var lastBlockRoot = await chain.getBlockRoot(blockHeight, 0);
          // console.log(lastBlockRoot + ' == ' + proposal);
          assert(lastBlockRoot == proposal);
        });

        it('generated the correct proof (by the client)', async () => {
          // const leafValue = web3Utils.soliditySha3(token.address, accounts[0], deposit.toNumber());
          const leafValue = sha3(Buffer.from("1"));

          const index = 1;
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
          // assert.isTrue(await plasma.verifyProof(merkleTree.getHexProofForIndex(4), merkleTree.getHexRoot(), SparseMerkleTree.bufArrToHex([sha3(Buffer.from("4"))]), 4));
          const index = 1;
          const proof = merkleTree.getHexProofForIndex(index);
          // const leafValue = sha3(Buffer.from("1"));
          const leafValue = SparseMerkleTree.bufArrToHex([sha3(Buffer.from("1"))]);

          const res = await bank.verifyProof(
            proof,
            merkleTree.getHexRoot(),
            leafValue,
            index
          );

          assert(res);
        });

        /*
        it('exits with the correct amount of tokens', async () => {
          const proof = merkleTree.getHexProofForIndex(account);
          // console.log(account);

          await bank.exit(
            0,
            deposit.toNumber(),
            proof,
            {
              from: accounts[0]
            }
          );
        });
        */
      });
    });
  });
});
