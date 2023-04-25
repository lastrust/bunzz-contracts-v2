# ERC721 (MintRole)

ERC721MintRole module is a standard interface for non-fungible tokens, also known as deeds. 
The following standard allows for the implementation of a standard API for NFTs within smart contracts. 
This standard provides basic functionality to track and transfer NFTs.

## Overview

ERC721MintRole module provides the functions to create a nft collection and host its metadata will be assign directly using the base uri.

This module have the feature of minting as many tokens as you want and host their metadata on more centralized solutions like s3, in addition the tokens can be transferred to any address without restrictions.

For this particular example, the only values that the owner needs to be setup up are done during the deployment, but however there are other contract where the setup is more complex and necessitates more steps after deployment.

## How to use

1. Prepare the metadata for your tokens and upload them to a centralized solution like s3. More explanations here https://docs.bunzz.dev/product-docs/others/uri-argument-base-token-uri
2. When deploying the contract, you need to prepare 3 arguments, the first argument is a string and represents the name (ex: Bored Ape Yacht Club) of the token, the second argument is a string and represent the symbol ( ex: BAYC) of the token, the third argument represents the base URI(e.g. https://token-cdn-domain/ ) of the collection metadata, in this URI(Uniform Resource Identifier) you can point to a file where you can specify all the characteristics of the token like name (e.g. Bored Ape Yacht Club), symbol (e.g. BAYC), description, color, etc...
3. After you upload your metadata on s3 in return you will receive a link
4. The link represent the your metadata base uri, when you mint new tokens it will be directly added to the token metadata.
5. Call the “mint” function (it can only be called by an address that have the minter role), with the first argument representing the address that will receive the nft, and the second address being the id of the token
6. The metadata of a token can be retrieved by calling the “tokenURI” function, which the only argument being the id of the token (e.g. of data returned for tokenId 1 --> https://token-cdn-domain/1 )
7. A user can call the “transfer” function to transfer his nft’s to another user
8. A user can call “transferFrom” function to transfer nft’s from one user to another if he was approved by the owner of the nft

## Module Parameters

- name: string : Provides an unique name for your token
- symbol: string : Provides an unique identifier for your token
- baseTokenURI: string : Provides the metadata link, like https://docs.bunzz.dev/product-docs/module/nft/uri-argument-base-token-uri

## Main functions

### mint: Can only be called by the contract owner. Needs to provide the address that will receive the NFT. Needs to provide a token ID for metadata

- to: address : The tokens receiver
- _tokenId:	uint256 : New token id that will be minted

### tokenURI: Returns the uri of the metadata
- tokenId: uint256 : The id of the token