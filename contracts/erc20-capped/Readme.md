# ERC20MaxSupply

This module has maxSupply to limit the total supply of the ERC20 token.

## Overview

Generally, some ERC20 tokens have the max supply.
This is effective in reducing supply and increasing token value.

## How to use

The owner needs to set up the following items:

1. The owner can pause the transfer of tokens by using the function “pause”
2. The owner can unpause the transfer of tokens by using the function “unpause”
3. The owner can mint as many tokens as he wants, as long as not going over the cap that was set in the deployment transaction, by using the function “mint”, the function takes two arguments, the first argument represents the address that will receive the tokens and the second argument represent the number of tokens it will receive
4. A user can call the “transfer” function to transfer his tokens to another user
5. A user can call “transferFrom” function to transfer tokens from one user to another if he was approved by the owner of the.
6. A user can approve another user to use his balance by calling the function approve, the first argument represents the operator that will be approved to use the user balance, and the second argument represents the amount that the operator will be able to use.

## Module Parameters

- name: string : Provides an unique name for your token
- symbol: string : Provides an unique identifier for your token
- _maxSupply: uint256 : Provides the max supply value. the value is immutable.


## Main functions

### unpause: Unpause all tokens operations

No arguments

### pause: Pause all tokens operations

No arguments

### mint: Mint new tokens for a user

- to: address : The tokens receiver
- amount: uint256 : The amount of tokens that will be minted
