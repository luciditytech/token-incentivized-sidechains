pragma solidity 0.5.0;

import "./interfaces/IStakingBank.sol";
import "./StakingBankStorage.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "token-sale-contracts/contracts/Salable.sol";

import "contract-registry/contracts/interfaces/RegistrableWithSingleStorage.sol";
import "contract-registry/contracts/storageStrategy/interfaces/IStorageStrategy.sol";
import "digivice/contracts/interfaces/IVerifierRegistry.sol";
import "andromeda/contracts/interface/IChain.sol";

contract StakingBank is IStakingBank, Ownable, RegistrableWithSingleStorage {

  using SafeMath for uint256;

  bytes32 constant NAME = "StakingBank";

  modifier onlyWhenRevealPhase() {
    IChain andromeda = IChain(contractRegistry.contractByName("Chain"));
    require(address(andromeda) != address(0x0), "Chain address unknown");
    require(!andromeda.isProposePhase(), "can be executed onlyWhenRevealPhase");
    _;
  }

  constructor (address _contractRegistry, IStorageBase _storage)
  public
  RegistrableWithSingleStorage(_contractRegistry, _storage) {}

  function _storage() private view returns (StakingBankStorage) {
    return StakingBankStorage(address(singleStorage));
  }

  function contractName() external view returns (bytes32) {
    return NAME;
  }

  function withdraw(uint256 _value)
  external
  onlyWhenRevealPhase
  returns (bool) {
    StakingBankStorage bankStorage = _storage();
    IERC20 token = bankStorage.token();

    uint256 balance = bankStorage.stakingBalances(msg.sender);

    require(_value > 0 && _value <= balance, "nothing to withdraw");

    require(token.transfer(msg.sender, _value), "withdraw failed");

    balance = balance.sub(_value);
    bankStorage.setStakingBalance(msg.sender, balance);

    _notifyVerifierRegistryAboutDecreasingBalance(msg.sender, _value);

    return true;
  }

  // TODO should we restrict getting staking tokens during reveal phase as we restrict withdraw during propose?
  function receiveApproval(address _from)
  external
  returns (bool) {
    StakingBankStorage bankStorage = _storage();
    IERC20 token = bankStorage.token();

    uint256 allowance = token.allowance(_from, address(this));
    require(allowance > 0, "nothing to approve");

    require(token.transferFrom(_from, address(this), allowance), "transferFrom failed");
    bankStorage.setStakingBalance(_from, bankStorage.stakingBalances(_from).add(allowance));

    _notifyVerifierRegistryAboutIncreasingBalance(_from, allowance);

    return true;
  }

  function _notifyVerifierRegistryAboutIncreasingBalance(address _verifier, uint256 _add)
  private {
    IVerifierRegistry vr = IVerifierRegistry(contractRegistry.contractByName("VerifierRegistry"));
    require(address(vr) != address(0x0), "VerifierRegistry address unknown");
    require(vr.increaseShardBalance(_verifier, _add), "_notifyVerifierRegistryAboutStakeBalance failed");
  }

  function _notifyVerifierRegistryAboutDecreasingBalance(address _verifier, uint256 _sub)
  private {
    IVerifierRegistry vr = IVerifierRegistry(contractRegistry.contractByName("VerifierRegistry"));
    require(address(vr) != address(0x0), "VerifierRegistry address unknown");
    require(vr.decreaseShardBalance(_verifier, _sub), "_notifyVerifierRegistryAboutStakeBalance failed");
  }

  function stakingBalance(address _verifier) external view returns (uint256) {
    return _storage().stakingBalances(_verifier);
  }

  function token() external view returns (IERC20) {
    return _storage().token();
  }
}
