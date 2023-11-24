// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC4907.sol";

interface IMetaShelves is IERC4907 {
    /// @notice set the user and expires of a NFT
    /// @param tokenId The NFT to assign the user to
    /// @param user The address of the new user
    /// @param expires The UNIX timestamp when the user's rights expire
    function setUser(uint256 tokenId, address user, uint64 expires) external;

    /// @notice Get the user address of an NFT
    /// @param tokenId The NFT to get the user address for
    /// @return The address of the current user of the NFT
    function userOf(uint256 tokenId) external view returns (address);

    /// @notice Get the expiration time of the user's rights for an NFT
    /// @param tokenId The NFT to get the expiration time for
    /// @return The UNIX timestamp when the user's rights expire
    function userExpires(uint256 tokenId) external view returns (uint256);

    /// @notice Mint a new NFT
    /// @return The token ID of the minted NFT
    function nftMint() external returns (uint256);
}
