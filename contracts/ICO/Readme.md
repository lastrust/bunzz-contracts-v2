# ICO (Public Sale)

This module is used to create an initial coin offering, the main purpose is to collect funds for the continuity of the project.

## Overview

The contract owner will deploy the contract and set the token price.
The investors will buy the token in ETH.

## How to use

1. Deploy this module on the network you want.
when you deploy the contract, you need to set startTime and endTime in timestamp format
2. Set the token address.
You can set the token address using connectToOtherContracts function.
3. Set the token price using updatePrice function.
4. Now the users can buy the token in ETH.
5. When the token sale is finished, you can withdraw the ETH and rest of the token.

## Main functions

### connectToOtherContracts: set token address.

- addresses: address[] : token address array. the first address must be the token address.

### updatePrice: set token price.

- _price: uint256 : token price

### buy: buy the token in ETH

No arguments.

### withdrawETH: withdraw the ETH you get.

No arguments.

### withdrawToken: withdraw the rest of the token

No arguments.

