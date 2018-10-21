pragma solidity ^0.4.24;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/MerkleProof.sol';
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";
import 'token-sale-contracts/contracts/Token.sol';
import 'token-sale-contracts/contracts/HumanStandardToken.sol';

contract StakingBank is Ownable, ReentrancyGuard {
  address public tokenAddress;
  address public chainAddress;

  constructor(
    address _tokenAddress,
    address _chainAddress
  ) public {
    tokenAddress = _tokenAddress;
    chainAddress = _chainAddress;
  }

  mapping(address => uint256) public balances;
  mapping(address => bool) public locks;

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

    balances[_from] += allowance;

    return true;
  }

  function withdraw(uint256 _value) public returns (bool success) {
    uint256 balance = balances[msg.sender];
    
    require(_value > 0 && balance >= _value);

    Token token = Token(tokenAddress);

    require(token.transfer(msg.sender, _value));

    balances[msg.sender] -= _value;

    return true;
  }

  function burn(address _id, uint256 _value) public onlyOwner nonReentrant returns (bool success) {
    uint256 balance = balances[_id];
    require(_value > 0 && balance >= _value);

    Token token = Token(tokenAddress);
    require(token.transfer(0x0, _value));

    balances[msg.sender] -= _value;

    return true;
  }

  function lockAccount(address _id) public onlyOwner nonReentrant returns (bool success) {
    locks[_id] = true;
    return true;
  }

  function unlockAccount(address _id) public onlyOwner nonReentrant returns (bool success) {
    locks[_id] = false;
    return true;
  }
}
