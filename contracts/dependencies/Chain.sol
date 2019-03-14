pragma solidity 0.5.0;

// TODO when andromeda will be ready we can use real contract
import "contract-registry/contracts/interfaces/Registrable.sol";

contract Chain is Registrable {

  bytes32 constant NAME = "Chain";

  uint256 public blocksPerPhase;

  constructor (address _contractRegistry, uint256 _blocksPerPhase)
  public
  Registrable(_contractRegistry) {
    blocksPerPhase = _blocksPerPhase;
  }

  function contractName() external view returns (bytes32) {
    return NAME;
  }

  /// @return current block number with reference to whole cycle,
  ///         returned value will be between [0..C), where C is sum of all phases durations
  function getCurrentElectionCycleBlock()
  public
  view
  returns (uint256) {
    return block.number % (uint256(blocksPerPhase) * 2);
  }

  /// @return first block number (blockchain block) of current cycle
  function getFirstCycleBlock()
  public
  view
  returns (uint256) {
    return block.number - getCurrentElectionCycleBlock();
  }

  function isProposePhase()
  public
  view
  returns (bool) {
    return getCurrentElectionCycleBlock() < blocksPerPhase;
  }

}
