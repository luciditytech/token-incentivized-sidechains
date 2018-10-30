import { assert, expect } from 'chai';
import { assertRevert } from 'openzeppelin-solidity/test/helpers/assertRevert';
import web3Utils from 'web3-utils';

const SparseMerkleTree = require('../../lib/SparseMerkleTree');
const BN = require('bn.js');
const TestHelper = require('../helpers/TestHelper');

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
    let contract;
    let token;
    let registry;
    let chain;

    let snapshotId;
    let blocksPerPhase = 2;

    beforeEach(async () => {
      snapshotId = await TestHelper.takeSnapshot();

      token = await HumanStandardToken.new(
        1000,
        "Test Token",
        9,
        "TST"
      );

      contract = await PlasmaBank.new(
        0x0,
        0x0
      );
    });

    afterEach(async () => {
      await TestHelper.resetSnapshot(snapshotId);
    });

    describe("when a participant deposits tokens", () => {
      let allowance = new BN('1000', 10);

      beforeEach(async () => {
        await token.approve(contract.address, allowance.toNumber(), {
          from: accounts[0],
        });
      });

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
            allowance.toNumber(),
            null,
            {
              from: accounts[0]
            }
          );

          var staked = await getBalanceOf(token.address, stakingBankAddress);
          assert(staked === allowance.toNumber());

          var block = await web3.eth.getBlock("latest");
          var blocksToMine = new BN(block.number, 10).add(new BN(blocksPerPhase, 10));

          merkleTree = new SparseMerkleTree({
            '0x6a632b283169bb0e4587422b081393d1c2e29af3c36c24735985e9c95c7c0a02': Buffer.from("25")
          });

          await TestHelper.mineBlock(blocksToMine);

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

          await TestHelper.mineBlock(
            new BN(web3.eth.getBlock("latest").number, 10)
              .add(new BN(blocksPerPhase, 10))
          );

          await chain.reveal(
            proposal,
            secret
          );

          var blockHeight = await chain.getBlockHeight();

          var lastBlockRoot = await chain.getBlockRoot(blockHeight.toNumber() - 1, 0);
          assert(lastBlockRoot == proposal);
        });

        it('execute the method succesfully', async () => {
          const proof = merkleTree.getProofForIndex(
            '0x6a632b283169bb0e4587422b081393d1c2e29af3c36c24735985e9c95c7c0a02'
          );

          /*
          await contract.exit(
            0,
            0,
            []
          );
          */
        });
      });
    });
  });
});
