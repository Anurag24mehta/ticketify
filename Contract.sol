// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/eip/ERC721A.sol";
import "@thirdweb-dev/contracts/extension/LazyMint.sol";
import "@thirdweb-dev/contracts/extension/interface/IClaimableERC721.sol";
import "@thirdweb-dev/contracts/lib/Strings.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";

contract TicketNFT is ERC721A, IClaimableERC721, LazyMint, Ownable {
    using Strings for uint256;

    mapping(uint256 => string) public ticketMetadata;
    mapping(uint256 => bool) public ticketExpired;
    mapping(uint256 => string) public seatNumbers;
    mapping(string => bool) public seatBooked;
    mapping(string => uint256) public seatPrices;
    mapping(string => address) public seatOwners;

    uint256 public ticketPrice;
    uint256 public maxClaimable = 5;
    uint256 public maxSalePrice = 0.007 ether;
    uint256 public totalMinted = 0;
    uint256 public maxMintable;

    // Hard-coded IPFS image URL used in metadata.
    string public constant imageUrl = "https://ipfs.io/ipfs/bafkreifuammx4cgpyjcbc2otlqcqhipimhn63kppjygayfzqafhyrpan5m";

    // Events
    event SeatListedForSale(address indexed owner, string seat, uint256 price);
    event SeatBought(address indexed buyer, address indexed seller, string seat, uint256 price);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxMintable,
        uint256 _ticketPrice
    ) ERC721A(_name, _symbol) {
        _setupOwner(msg.sender);
        maxMintable = _maxMintable;
        ticketPrice = _ticketPrice;
    }

    // Withdraw funds to the owner's wallet
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Lazy minting validation
    function _canLazyMint() internal view override returns (bool) {
        return msg.sender == owner();
    }

    // Collect ETH for the claimed tickets
    function _collectPriceOnClaim(
        address _primarySaleRecipient,
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken
    ) internal virtual {
        require(_currency == address(0), "Only ETH payments allowed");
        uint256 totalPrice = _quantityToClaim * _pricePerToken;
        require(msg.value >= totalPrice, "Insufficient ETH sent");
        payable(_primarySaleRecipient).transfer(totalPrice);
    }

    // Mint tickets for the claimed seats
    function _transferTokensOnClaim(
        address _to,
        uint256 _quantityBeingClaimed,
        string[] calldata _seatNumbers
    ) internal virtual {
        for (uint256 i = 0; i < _quantityBeingClaimed; i++) {
            string memory seatNumber = _seatNumbers[i];
            require(!seatBooked[seatNumber], "Seat already booked");

            uint256 tokenId = totalSupply();  // Get the current token ID
            // Generate metadata without price field.
            ticketMetadata[tokenId] = _generateMetadata(tokenId, seatNumber, false);
            ticketExpired[tokenId] = false;  // Set ticket as not expired
            seatNumbers[tokenId] = seatNumber;  // Store the seat number
            seatBooked[seatNumber] = true;  // Mark seat as booked

            _safeMint(_to, 1);  // Mint the token for the current seat
        }
    }

    // Claim tickets and mint NFTs
    function claim(address _receiver, uint256 _quantity, string[] calldata _seatNumbers) external payable override {
        // Ensure the total number of minted NFTs does not exceed the max allowed
        require(totalMinted + _quantity <= maxMintable, string(abi.encodePacked(
            "Cannot mint more than the max mintable tokens. Maximum allowed: ",
            maxMintable.toString()
        )));

        // Verify the claim (maximum claimable tickets)
        verifyClaim(msg.sender, _quantity);

        uint256 totalPrice = _quantity * ticketPrice;

        // Ensure enough ETH is sent for the purchase
        require(msg.value >= totalPrice, "Insufficient ETH sent");

        // Collect the price and transfer the tokens to the correct address
        _collectPriceOnClaim(owner(), _quantity, address(0), ticketPrice);

        // Mint the claimed tickets
        _transferTokensOnClaim(_receiver, _quantity, _seatNumbers);

        // Update the number of total minted NFTs
        totalMinted += _quantity;

        // Emit an event for the claimed tokens.
        // Here we use the current next token id (totalSupply()) as a reference.
        emit TokensClaimed(msg.sender, _receiver, totalSupply(), _quantity);
    }

    // Verify if the claim can be processed
    function verifyClaim(address _claimer, uint256 _quantity) public view override {
        require(_quantity <= maxClaimable, "Cannot claim more than max allowed");
    }

    // Return token URI metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return ticketMetadata[tokenId];
    }

    // Mark a ticket as expired
    function setTicketExpired(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(!ticketExpired[tokenId], "Ticket already expired");
        ticketExpired[tokenId] = true;
        ticketMetadata[tokenId] = _generateMetadata(tokenId, seatNumbers[tokenId], true);
    }

    // Generate metadata for the ticket (without price)
    function _generateMetadata(uint256 tokenId, string memory seatNumber, bool expired) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"name": "Concert Ticket #', tokenId.toString(), '",',
            ' "description": "Exclusive Concert Ticket",',
            ' "image": "https://ipfs.io/ipfs/bafkreifuammx4cgpyjcbc2otlqcqhipimhn63kppjygayfzqafhyrpan5m",',
            ' "attributes": [',
            ' {"trait_type": "Seat", "value": "', seatNumber, '"},',
            ' {"trait_type": "Expired", "value": "', expired ? "true" : "false", '"} ',
            ']}'
        ));
    }

    // Get NFTs owned by an address and return an array of metadata JSON strings (without price field)
    function getNFTsByOwner(address owner) external view returns (string[] memory) {
        uint256 balance = balanceOf(owner);
        string[] memory ownedNFTs = new string[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < totalSupply(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                // Return the metadata stored during mint.
                ownedNFTs[index] = ticketMetadata[i];
                index++;
            }
        }
        return ownedNFTs;
    }

    // Get booked seats for the event
    function getBookedSeats() external view returns (string[] memory) {
        uint256 totalSupplyCount = totalSupply();
        string[] memory bookedSeats = new string[](totalSupplyCount);
        uint256 index = 0;

        for (uint256 i = 0; i < totalSupplyCount; i++) {
            if (_exists(i) && bytes(seatNumbers[i]).length > 0) {
                bookedSeats[index] = seatNumbers[i];
                index++;
            }
        }

        return bookedSeats;
    }

    // Ensure only the owner can set the owner status
    function _canSetOwner() internal view virtual override returns (bool) {
        return msg.sender == owner();
    }

    // List the seat numbers owned by an address (if needed)
    function listOwnedTickets(address owner) external view returns (string[] memory) {
        uint256 balance = balanceOf(owner);
        string[] memory ownedSeats = new string[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < totalSupply(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                ownedSeats[index] = seatNumbers[i];
                index++;
            }
        }
        return ownedSeats;
    }

    // List a seat for sale by its owner
    function listSeatForSale(string memory seat, uint256 price) external {
        require(seatBooked[seat], "Seat does not exist");
        require(ownerOf(_getTokenIdBySeat(seat)) == msg.sender, "You do not own this seat");
        require(price <= maxSalePrice, "Price exceeds maximum allowed sale price");
        require(seatPrices[seat] == 0, "Seat is already listed for sale"); // Prevent changing price
        seatPrices[seat] = price;
        seatOwners[seat] = msg.sender;

        emit SeatListedForSale(msg.sender, seat, price);
    }

    // Purchase a seat that is listed for sale
    function buySeat(string memory seat) external payable {
        require(seatPrices[seat] > 0, "Seat is not for sale");
        require(msg.value == seatPrices[seat], "Incorrect ETH amount sent");

        address seller = seatOwners[seat];
        require(seller != msg.sender, "Cannot buy your own seat");

        uint256 tokenId = _getTokenIdBySeat(seat);

        // Transfer token from seller to buyer
        safeTransferFrom(seller, msg.sender, tokenId);

        // Transfer payment to the seller
        payable(seller).transfer(msg.value);

        // Remove seat from sale and update seat owner mapping
        delete seatPrices[seat];
        seatOwners[seat] = msg.sender;

        emit SeatBought(msg.sender, seller, seat, msg.value);
    }

    /**
     * @notice Returns an array of JSON strings for each seat currently listed for sale.
     * Each JSON string contains the ticket metadata with an additional "price" field.
     * For example:
     * [
     *   "{\"name\": \"Concert Ticket #1\", \"description\": \"Exclusive Concert Ticket\", \"image\": \"https://ipfs.io/ipfs/bafkreifuammx4cgpyjcbc2otlqcqhipimhn63kppjygayfzqafhyrpan5m\", \"price\": \"5000000000000000\", \"attributes\": [ {\"trait_type\": \"Seat\", \"value\": \"A3\"}, {\"trait_type\": \"Expired\", \"value\": \"false\"} ]}",
     *   ...
     * ]
     */
    function listSeatsOnSale() external view returns (string[] memory) {
        uint256 total = totalSupply();
        // First count the seats on sale.
        uint256 count = 0;
        for (uint256 i = 0; i < total; i++) {
            if (seatPrices[seatNumbers[i]] > 0) {
                count++;
            }
        }

        string[] memory seatsOnSale = new string[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < total; i++) {
            string memory seat = seatNumbers[i];
            if (seatPrices[seat] > 0) {
                // Build the JSON string with an extra "price" field.
                // Note: We convert the price to a string.
                string memory json = string(abi.encodePacked(
                    '{"name": "Concert Ticket #', i.toString(),
                    '", "description": "Exclusive Concert Ticket", ',
                    '"image": "', imageUrl, '", ',
                    '"price": "', seatPrices[seat].toString(), '", ',
                    '"attributes": [',
                    '{ "trait_type": "Seat", "value": "', seat, '"}, ',
                    '{ "trait_type": "Expired", "value": "', ticketExpired[i] ? "true" : "false", '"}',
                    ']'
                    "}"
                ));
                seatsOnSale[index] = json;
                index++;
            }
        }
        return seatsOnSale;
    }

    // Internal helper to get tokenId by seat number
    function _getTokenIdBySeat(string memory seat) internal view returns (uint256) {
        for (uint256 i = 0; i < totalSupply(); i++) {
            if (keccak256(abi.encodePacked(seatNumbers[i])) == keccak256(abi.encodePacked(seat))) {
                return i;
            }
        }
        revert("Seat not found");
    }

    // Get complete details for a seat listed for sale
    function getSeatDetails(string memory seat) external view returns (string memory, uint256, address, string memory, bool) {
        uint256 tokenId = _getTokenIdBySeat(seat);
        require(_exists(tokenId), "NFT does not exist for the seat");

        string memory metadata = ticketMetadata[tokenId];
        uint256 price = seatPrices[seat];
        address owner = seatOwners[seat];
        bool expired = ticketExpired[tokenId];

        return (metadata, price, owner, seat, expired);
    }
}