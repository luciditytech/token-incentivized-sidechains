# Andromeda
A toolkit for developing Token Incentivized Sidechains on top of Ethereum.

## Overview

This repo provides a set of on-chain and off-chain tools to build generalized Proof-of-Stake sidechains with non-custodial payments.

## Prerequisites

1. [brew](http://brew.sh)

  ```sh
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  ```

1. [HubFlow](http://datasift.github.io/gitflow/)

  ```sh
  brew install hubflow
  ```

> If you are on Linux

  ```sh
  git clone https://github.com/datasift/gitflow
  cd gitflow
  sudo ./install.sh
  ```

---

## Setup

1. `npm install -g truffle solhint`
  * [IDE Integrations for solhint](https://github.com/protofire/solhint#ide-integrations)
1. `git clone git@github.com:luciditytech/token-incentivized-sidechains.git`
1. `npm install`
1. `git hf init`

---

## Compiling and migrating smart contracts

1. `truffle compile`
1. `truffle migrate`

---

## Testing smart contracts

> Be sure compiled contracts are latest before testing
1. `truffle test`
1. With code coverage: `npm test`

---

## Linting smart contracts
1. `solhint "contracts/**/*.sol"`

---

## Development Sidechain

Use the following instructions to setup a development enviroment to test and develop sidechain applications.

### Launch Smart Contracts

You can edit the `config/develpment.json` file to review and make changes prior to deploying the contracts.
Use `truffle migrate` to deploy all relevant smart contracts to your local devnet using sane defaults.

The development migration scripts will launch a new ERC-20 token, Verifier Registry, Andromeda rootchain contracts, and the Participant Registry.

### Add Local Verifier Entry

Access the `truffle` console using: `truffle console`.

Add a new development verifier using the following:

```
var verifierRegistry = VerifierRegistry.at(VerifierRegistry.address);
verifierRegistry.create("http://127.0.0.1:9000", web3.eth.accounts[0], true);
```

Validate that the new verifier was created:

```
verifierRegistry.verifiers(web3.eth.accounts[0]);
```

Validate the number of registered verifiers:

```
verifierRegistry.getNumberOfVerifiers().then((v) => v.toNumber());
```

### Set Tokens at Stake

In order to participate in consensus, the local verifier must first deposit tokens that will be set at stake during consensus.

Access the `truffle` console using: `truffle console`.

```
var token = HumanStandardToken.at(HumanStandardToken.address);

var chain = Chain.at(Chain.address);
var bankAddress; chain.stakingBank().then((s) => bankAddress = s);

...

var stakingBank = StakingBank.at(bankAddress);

token.approveAndCall(stakingBank.address, 1, null, { from: web3.eth.accounts[0] });

stakingBank.balances(web3.eth.accounts[0]).then((v) => v.toNumber());
```

### Start Verifier Message Listener Service

### Start Verifier Message Handler Service

### Add Participant Entry

### Start Consensus Handler Service
