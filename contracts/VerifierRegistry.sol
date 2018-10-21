pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'token-sale-contracts/contracts/Token.sol';
import 'token-sale-contracts/contracts/HumanStandardToken.sol';

contract VerifierRegistry is Ownable {
  event LogVerifierRegistered(
    address id
  );

  event LogVerifierUpdated(
    address id
  );

  struct Verifier {
    address id;
    string location;
    bool created;
    bool enabled;
    uint256 shard;
  }

  mapping(address => Verifier) public verifiers;

  address[] public addresses;
  address public tokenAddress;
  uint256 public verifiersPerShard;

  function VerifierRegistry(address _tokenAddress, uint256 _verifiersPerShard) {
    tokenAddress = _tokenAddress;
    verifiersPerShard = _verifiersPerShard;
  }

  function create(string _location, address _account, bool _enabled) public onlyOwner {
    Verifier storage verifier = verifiers[_account];

    require(!verifier.created);

    verifier.id =_account;
    verifier.location = _location;
    verifier.created = true;
    verifier.enabled = _enabled;
    verifier.shard = uint256(addresses.length) / verifiersPerShard;

    addresses.push(verifier.id);

    LogVerifierRegistered(verifier.id);
  }

  function update(string _location, address _account, bool _enabled) public onlyOwner {
    Verifier storage verifier = verifiers[_account];

    require(verifier.created);

    verifier.location = _location;

    LogVerifierUpdated(verifier.id);
  }

  function getNumberOfVerifiers() public view returns (uint256) {
    return addresses.length;
  }

  function updateVerifiersPerShard(uint256 _newVerifiersPerShard) public onlyOwner {
    require(_newVerifiersPerShard > 0);

    verifiersPerShard = _newVerifiersPerShard;
  }
}
