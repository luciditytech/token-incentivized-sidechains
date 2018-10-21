pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract ParticipantRegistry is Ownable {
  event LogParticipantCreated(
    address id
  );

  event LogParticipantUpdated(
    address id
  );

  struct Participant {
    address id;
    string role;
    string publicKey;
    bool created;
  }

  mapping(address => Participant) public participants;

  address[] public ids;

  function create(address _id, string _role, string _publicKey) public onlyOwner {
    Participant storage participant = participants[_id];
  
    require(!participant.created);

    participant.id = _id;
    participant.role = _role;
    participant.publicKey = _publicKey;
    participant.created = true;

    ids.push(participant.id);
    
    LogParticipantCreated(
      participant.id
    );
  }

  function update(address _id, string _role, string _publicKey) public onlyOwner {
    Participant storage participant = participants[_id];

    require(participant.created);

    participant.role = _role;
    participant.publicKey = _publicKey;

    LogParticipantUpdated(
      participant.id
    );
  }

  function getNumberOfIds() public view returns (uint) {
    return ids.length;
  }
}
