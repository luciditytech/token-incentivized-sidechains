pragma solidity ^0.4.24;

import "./Chain.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import 'token-sale-contracts/contracts/Token.sol';
import 'token-sale-contracts/contracts/HumanStandardToken.sol';

contract PlasmaBank is Ownable, ReentrancyGuard {
  address public tokenAddress;
  address public chainAddress;

  constructor(
    address _tokenAddress,
    address _chainAddress
  ) public {
    tokenAddress = _tokenAddress;
    chainAddress = _chainAddress;
  }

  mapping(uint256 => mapping(address => bool)) withdrawals;

  function receiveApproval(
    address _from,
    uint256 _value,
    address _token,
    bytes _data
  ) public nonReentrant returns (bool success) {
    require(_token == tokenAddress);

    Token token = Token(tokenAddress);
    uint256 allowance = token.allowance(_from, this);

    require(allowance > 0);
    require(token.transferFrom(_from, this, allowance));

    return true;
  }

  function exit(
    uint256 _shard,
    uint256 _balance,
    bytes _proof
  ) public nonReentrant returns (bool success) {
    var (blockHeight, root) = lastValidBlockRootForShard(_shard);
    require(blockHeight > 0, "couldn't find valid block height");

    bool withdrewAtBlock = withdrawals[blockHeight][msg.sender];
    require(!withdrewAtBlock, "account already withdrew in the current consensus round");

    bytes32 leafValue = keccak256(_balance);

    require(
      verifyProof(
        _proof,
        root,
        leafValue,
        uint256(msg.sender)
      ),
      "proof could not be verified"
    );

    Token token = Token(tokenAddress);

    require(token.transfer(msg.sender, _balance), "token transfer failed");

    withdrawals[blockHeight][msg.sender] = true;

    return true;
  }

  function lastValidBlockRootForShard(uint256 _shard) internal returns (uint256, bytes32) {
    Chain chain = Chain(chainAddress);
    uint256 blockHeight = chain.getBlockHeight();

    for (uint256 i = blockHeight; i >= 0; i--) {
      bytes32 root = chain.getBlockRoot(i, _shard);

      if (root != 0x0) {
        return (i, root);
      }
    }

    return (blockHeight, root);
  }

  /*
   * @dev Merkle proof verification
   * @note Based on https://github.com/ameensol/merkle-tree-solidity/blob/master/src/MerkleProof.sol
  */

  function verifyProof(bytes _proof, bytes32 _root, bytes32 _leaf, uint256 _index) public pure returns (bool) {
    // Check if proof length is a multiple of 32
    if (_proof.length % 32 != 0) {
      return false;
    }

    // TODO: move defaultHashes here in order to reduce (_proof) size

    bytes32 proofElement;
    bytes32 computedHash = _leaf;

    for (uint256 i = 32; i <= _proof.length; i += 32) {
      assembly {
        // Load the current element of the proof
        proofElement := mload(add(_proof, i))
      }

      if (_index % 2 == 0) {
        // Hash(current computed hash + current element of the proof)
        computedHash = keccak256(computedHash, proofElement);
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash = keccak256(proofElement, computedHash);
      }
      _index = _index / 2;
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash == _root;
  }
}
