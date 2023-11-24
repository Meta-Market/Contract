// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMMT is IERC20 {
    /// @notice Returns the constant MINTER_ROLE identifier
    function MINTER_ROLE() external view returns (bytes32);

    /// @notice Mints tokens to a specified address
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external;

    /// @notice Grants a role to an account
    /// @param role The role to grant
    /// @param account The account to grant the role to
    function grantRole(bytes32 role, address account) external;

    /// @notice Returns if the account has a specific role
    /// @param role The role to check
    /// @param account The account to check for the role
    /// @return bool True if the account has the role, otherwise false
    function hasRole(bytes32 role, address account) external view returns (bool);
}
