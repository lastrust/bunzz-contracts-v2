# ERC1155BurnableAndPausable

ERC1155BurnableAndPausable is a standard interface for contracts that manage multiple token types. A single deployed contract may include any combination of fungible tokens, non-fungible tokens or other configurations (e.g. semi-fungible tokens).

## Overvierw

ERC1155BurnableAndPausable module provides the functions to create a nft collection and has more complex functions available. This module have the feature of minting as many tokens as you want and host their metadata on more centralized solutions like s3, in addition the tokens can be transferred to any address without restrictions. For this particular example, the only values that the owner needs to be setup up are done during the deployment, but however there are other contract where the setup is more complex and necessitates more steps after deployment.

## How to use

1. Prepare the metadata for your tokens and upload them to a centralized solution like s3. More explanations here https://docs.bunzz.dev/product-docs/others/uri-argument-base-token-uri
2. When deploying the contract, you need to prepare 1 argument and that argument represents the URI (e.g. https://token-cdn-domain/{id}.json ) of the collection metadata, in this URI(Uniform Resource Identifier) you can point to a file where you can specify all the characteristics of the token like name (e.g. Bored Ape Yacht Club), symbol (e.g. BAYC), description, color, etc...
3. After you upload your metadata on s3 in return you will receive a link
4. The link represent your metadata base uri, when you mint new tokens it will be directly added to the token metadata.
5. Call the “mint” function (it can only be called by an address that have the minter role), with the first argument representing the address that will receive the nft, and the second argument being the id of the token, the third argument is called amount and represents how many tokens of that id you want to mint and the final argument is called data and this one is optional
6. Call the “mintBatch” function (it can only be called by an address that have the minter role), with the first argument representing the address that will receive the nft, and the second argument being an array of ids of tokens, the third argument is called amounts, it is again an array and represents how many tokens of each id you want to mint and the final argument is called data and this one is optional
7. The metadata of a token can be retrieved by calling the “uri” function, This implementation returns the same URI for all token types. It relies on the token type ID substitution mechanism https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP]. Clients calling this function must replace the \{id\} substring with the actual token type ID.
8. A user can call the “transfer” function to transfer his nft’s to another user
9. A user can call “transferFrom” function to transfer nft’s from one user to another if he was approved by the owner of the nft


## Module Parameters

uri: string : Provides the metadata link, like https://docs.bunzz.dev/product-docs/module/nft/uri-argument-base-token-uri

## Main Functions

### mint: Mint a new token

- to: address : The token receiver
- id: uint256 : The id of the token
- amount: uint256 : The amount of tokens
- data:	bytes : Optional data field


### mintBatch: Mint new tokens in a batch

- to: address : The token receiver
- ids: uint256[] : The token ids
- amounts: uint256[] : The tokens amounts
- data:	bytes : Optional data field

### pause: Pause all operations

No arguments

### unpause: Unpause all operations

No arguments