# ERC20 module (Burnable And Pausable)

## Overview
ERC20BurnableAndPausable module represents the functionality that a project may need when is looking to create an ERC20 token with minting, burning and pausing capabilities.

The name and symbol of the token will be set by the owner in the constructor of the contract during deployment.

All the detail can be updated by using a public function that will be explained in the further section.

## How to use

The owner needs to set up the following items:

1. During deployment the owne needs to set up 2 arguments, first one is called name (e.g. Tether), and the second one is symbol (e.g. USDT), the symbol represents a unique identified for your token
2. The owner can pause the transfer of tokens by using the function “pause”
3. The owner can unpause the transfer of tokens by using the function “unpause”
4. The owner can mint as many tokens as he wants, by using the function “mint”, the function takes two arguments, the first argument represents the address that will receive the tokens and the second argument represent the number of tokens it will receive
5. A user can call the “transfer” function to transfer his tokens to another user
6. A user can call “transferFrom” function to transfer tokens from one user to another if he was approved by the owner of the.
7. A user can approve another user to use his balance by calling the function approve, the first argument represents the operator that will be approved to use the user balance, and the second argument represents the amount that the operator will be able to use.

## Module Parameters

- name: string : Provides an unique name for your token
- symbol: string : Provides an unique identifier for your token

## Main Functions

### mint: Mint new tokens for a user
amount:	uint256	: The amount of tokens that will be minted

### pause: Returns the paused status of the contract
No arguments

### unpause: Unpause all tokens operations
No arguments
