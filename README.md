# Andromeda
A toolkit for developing Token Incentivized Sidechains on top of Ethereum.

## Overview

This repo provides a set of on-chain and off-chain tools to build generalized Proof-of-Stake sidechains with non-custodial payments.

---

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
