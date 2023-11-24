// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract MMT is ERC20, AccessControlEnumerable {
    bytes32 public constant MINTER_ROLE = bytes32(uint256(1));

    constructor(
        address admin,
        address minter
    ) ERC20("Centurion Invest Token", "MMT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
        _mint(_msgSender(), 1000000000 * 10**uint256(decimals()));
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
