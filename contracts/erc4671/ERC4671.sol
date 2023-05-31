pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "./interfaces/IERC4671.sol";
import "./interfaces/IERC4671Metadata.sol";
import "./interfaces/IERC4671Enumerable.sol";

contract ERC4671 is IERC4671, IERC4671Metadata, IERC4671Enumerable, ERC165 {

    struct Token {
        address issuer;
        address owner;
        bool valid;
    }

    mapping(uint256 => Token) private _tokens;

    mapping(address => uint256[]) private _indexedTokenIds;

    mapping(address => mapping(uint256 => uint256)) private _tokenIdIndex;

    mapping(address => uint256) private _numberOfValidTokens;

    string private _name;

    string private _symbol;

    string public baseURI;

    uint256 private _emittedCount;

    uint256 private _holdersCount;

    address public _creator;

    modifier onlyCreator() {
        require(msg.sender == _creator, "The function can only be called by the creator");
        _;
    }

    constructor (string memory name_, string memory symbol_, string memory baseURI_) {
        _name = name_;
        _symbol = symbol_;
        baseURI = baseURI_;
        _creator = msg.sender;
    }

    function balanceOf(address owner) public view virtual override returns (uint256) {
        return _indexedTokenIds[owner].length;
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        return _getTokenOrRevert(tokenId).owner;
    }

    function isValid(uint256 tokenId) public view virtual override returns (bool) {
        return _getTokenOrRevert(tokenId).valid;
    }

    function hasValid(address owner) public view virtual override returns (bool) {
        return _numberOfValidTokens[owner] > 0;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _getTokenOrRevert(tokenId);
        bytes memory baseURI = bytes(_baseURI());
        if (baseURI.length > 0) {
            return string(abi.encodePacked(
                baseURI,
                Strings.toString(tokenId)
            ));
        }
        return "";
    }

    function emittedCount() public view override returns (uint256) {
        return _emittedCount;
    }

    function holdersCount() public view override returns (uint256) {
        return _holdersCount;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual override returns (uint256) {
        uint256[] storage ids = _indexedTokenIds[owner];
        require(index < ids.length, "Token does not exist");
        return ids[index];
    }

    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        return index;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
        interfaceId == type(IERC4671).interfaceId ||
        interfaceId == type(IERC4671Metadata).interfaceId ||
        interfaceId == type(IERC4671Enumerable).interfaceId ||
        super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view virtual returns (string memory) {
        return baseURI;
    }

    function revoke(uint256 tokenId) external onlyCreator {
        _revoke(tokenId);
    }

    function _revoke(uint256 tokenId) internal virtual {
        Token storage token = _getTokenOrRevert(tokenId);
        require(token.valid, "Token is already invalid");
        token.valid = false;
        require(_numberOfValidTokens[token.owner] > 0, "No valid tokens to be revoked for this owner");
        _numberOfValidTokens[token.owner] -= 1;
        emit Revoked(token.owner, tokenId);
    }

    function mint(address owner) external onlyCreator returns (uint256 tokenId){
        tokenId = _mint(owner);
    }

    function _mint(address owner) internal virtual returns (uint256 tokenId) {
        require(owner != address(0x0), "Owner is zero address");
        tokenId = _emittedCount;
        _mintUnsafe(owner, tokenId, true);
        emit Minted(owner, tokenId);
        _emittedCount += 1;
    }

    function _mintUnsafe(address owner, uint256 tokenId, bool valid) internal {
        require(_tokens[tokenId].owner == address(0), "Cannot mint an assigned token");
        if (_indexedTokenIds[owner].length == 0) {
            _holdersCount += 1;
        }
        _tokens[tokenId] = Token(msg.sender, owner, valid);
        _tokenIdIndex[owner][tokenId] = _indexedTokenIds[owner].length;
        _indexedTokenIds[owner].push(tokenId);
        if (valid) {
            _numberOfValidTokens[owner] += 1;
        }
    }

    function _getTokenOrRevert(uint256 tokenId) internal view virtual returns (Token storage) {
        Token storage token = _tokens[tokenId];
        require(token.owner != address(0), "Token does not exist");
        return token;
    }

    function _removeToken(uint256 tokenId) internal virtual {
        Token storage token = _getTokenOrRevert(tokenId);
        _removeFromUnorderedArray(_indexedTokenIds[token.owner], _tokenIdIndex[token.owner][tokenId]);
        if (_indexedTokenIds[token.owner].length == 0) {
            require(_holdersCount > 0, "No holders to remove tokens from");
            _holdersCount -= 1;
        }
        if (token.valid) {
            require(_numberOfValidTokens[token.owner] > 0, "No valid tokens found for this owner");
            _numberOfValidTokens[token.owner] -= 1;
        }
        delete _tokens[tokenId];
    }

    function _removeFromUnorderedArray(uint256[] storage array, uint256 index) internal {
        require(index < array.length, "Trying to delete out of bound index");
        if (index != array.length - 1) {
            array[index] = array[array.length - 1];
        }
        array.pop();
    }
}