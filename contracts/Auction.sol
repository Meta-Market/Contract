// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMetaShelves.sol";
import "./IMMT.sol";

contract Auction is Ownable {
    IMMT public mmtToken;
    IMetaShelves public metaShelves;

    struct AuctionDetails {
        uint256 tokenId;
        uint256 tokenExpires;
        uint256 startTime;
        uint256 duration;
        uint256 minBid;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    AuctionDetails[] public auctions;
    mapping(uint256 => uint256) public auctionOfToken;

    event AuctionStarted(uint256 tokenId,uint256 tokenExpires, uint256 minBid, uint256 duration);
    event BidPlaced(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    event TokenClaimed(uint256 tokenId, address claimant);

    constructor(address _mmtToken, address _metaShelves) {
        mmtToken = IMMT(_mmtToken);
        metaShelves = IMetaShelves(_metaShelves);
    }

    function startAuction(uint256 _tokenId, uint256 _minBid, uint256 _duration) external onlyOwner {
        // Token's current auction, if any, must be over
        require(auctions[auctionOfToken[_tokenId]].ended, "Auction already running for this token");
        // If there's an auction that has ended, the expiry must be less than the auction's duration
        require(metaShelves.userExpires(_tokenId) < block.timestamp + _duration, "Token expires after auction ends");

        // Create a new auction
        AuctionDetails memory auction = AuctionDetails({
            tokenId: _tokenId,
            tokenExpires: metaShelves.userExpires(_tokenId),
            startTime: block.timestamp,
            duration: _duration,
            minBid: _minBid,
            highestBidder: address(0),
            highestBid: 0,
            ended: false
        });
        auctions.push(auction);
        auctionOfToken[_tokenId] = auctions.length - 1;
    }

    function bid(uint256 auction,uint256 _amount) external {
        // Auction must be running
        require(!auctions[auction].ended, "Auction has ended");
        // Bid must be greater than the highest bid
        require(_amount > auctions[auction].highestBid, "Bid must be greater than highest bid");
        // Bid must be greater than the minimum bid
        require(_amount > auctions[auction].minBid, "Bid must be greater than minimum bid");
        // Bidder must have enough MMT tokens
        require(mmtToken.balanceOf(msg.sender) >= _amount, "Insufficient MMT balance");

        // If there's a previous highest bidder, return their MMT tokens
        if (auctions[auction].highestBidder != address(0)) {
            mmtToken.transfer(auctions[auction].highestBidder, auctions[auction].highestBid);
        }

        // Send mmt tokens to the contract
        mmtToken.transferFrom(msg.sender, address(this), _amount);

        // Update the auction
        auctions[auction].highestBidder = msg.sender;
        auctions[auction].highestBid = _amount;

        emit BidPlaced(msg.sender, _amount);
    }

    function endAuction(uint256 auctionId) external {
        // Auction must be running
        require(!auctions[auctionId].ended, "Auction has ended");
        // Auction must have ended
        require(block.timestamp >= auctions[auctionId].startTime + auctions[auctionId].duration, "Auction has not ended");
        // Auction must have a highest bidder
        require(auctions[auctionId].highestBidder != address(0), "Auction has no bids");

        // Transfer the token to the highest bidder
        metaShelves.setUser(auctions[auctionId].tokenId, auctions[auctionId].highestBidder, uint64(block.timestamp + auctions[auctionId].tokenExpires));
        // Transfer the MMT tokens to the owner
        mmtToken.transfer(owner(), auctions[auctionId].highestBid);

        // Update the auction
        auctions[auctionId].ended = true;

        emit AuctionEnded(auctions[auctionId].highestBidder, auctions[auctionId].highestBid);
    }
}
