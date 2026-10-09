// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVerifier} from "./verifiers/IVerifier.sol";

/// @notice Invoice ownership and settlement for revine. v26.0 on Sepolia.
/// @dev Invoice tokens are non-transferable except for the transfer performed during buyInvoice.
contract RevineInvoice is ERC721 {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_FACE_AMOUNT = 10_000_000_000;
    uint64 public constant MAX_DUE_DATE_AHEAD = 366 days;
    uint64 public constant MAX_ATTESTATION_AGE = 30 days;

    enum Status {
        Created,
        Verified,
        Rejected,
        Listed,
        Financed,
        Paid
    }

    struct Invoice {
        address seller;
        address buyer;
        uint256 faceAmount;
        uint256 askPrice;
        bytes32 commitment;
        uint64 dueDate;
        uint64 createdAt;
        uint64 respondedAt;
        uint64 listedAt;
        uint64 financedAt;
        uint64 paidAt;
        Status status;
    }

    struct CreditBadge {
        uint256 threshold;
        uint64 attestedAt;
        uint64 verifiedAt;
    }

    /// @notice Flattened view consumed by the frontend ABI.
    struct InvoiceView {
        uint256 id;
        address seller;
        address buyer;
        address holder;
        uint256 faceAmount;
        uint256 askPrice;
        bytes32 commitment;
        uint64 dueDate;
        uint64 createdAt;
        uint64 respondedAt;
        uint64 listedAt;
        uint64 financedAt;
        uint64 paidAt;
        Status status;
    }

    error NotBuyer();
    error NotHolder();
    error WrongStatus();
    error InvalidBuyer();
    error InvalidAmount();
    error InvalidDueDate();
    error CommitmentUsed();
    error InvalidProof();
    error InvalidPrice();
    error PastDue();
    error CannotBuyOwn();
    error TransfersDisabled();
    error AttestationExpired();

    event InvoiceCreated(
        uint256 indexed id,
        address indexed seller,
        address indexed buyer,
        uint256 faceAmount,
        uint64 dueDate,
        bytes32 commitment
    );
    event InvoiceConfirmed(uint256 indexed id);
    event InvoiceRejected(uint256 indexed id);
    event InvoiceListed(uint256 indexed id, uint256 askPrice);
    event InvoiceUnlisted(uint256 indexed id);
    event InvoiceFinanced(uint256 indexed id, address indexed financier, uint256 price);
    event InvoicePaid(uint256 indexed id, address indexed recipient, uint256 amount);
    event CreditVerified(address indexed seller, uint256 threshold, uint64 attestedAt);

    IERC20 public immutable midr;
    IVerifier public immutable invoiceVerifier;
    IVerifier public immutable creditVerifier;

    mapping(uint256 id => Invoice invoice) public invoices;
    mapping(bytes32 commitment => bool used) public usedCommitment;
    mapping(address seller => CreditBadge badge) public creditBadge;

    uint256 private _invoiceCount;

    constructor(IERC20 midr_, IVerifier invoiceVerifier_, IVerifier creditVerifier_)
        ERC721("revine. Invoice", "RVI")
    {
        midr = midr_;
        invoiceVerifier = invoiceVerifier_;
        creditVerifier = creditVerifier_;
    }

    function createInvoice(
        address buyer,
        uint256 faceAmount,
        uint64 dueDate,
        bytes32 commitment,
        bytes calldata proof
    ) external returns (uint256 id) {
        if (buyer == address(0) || buyer == msg.sender) revert InvalidBuyer();
        if (faceAmount == 0 || faceAmount > MAX_FACE_AMOUNT) revert InvalidAmount();
        if (dueDate <= block.timestamp || uint256(dueDate) > block.timestamp + MAX_DUE_DATE_AHEAD) {
            revert InvalidDueDate();
        }
        if (usedCommitment[commitment]) revert CommitmentUsed();

        bytes32[] memory publicInputs = new bytes32[](5);
        publicInputs[0] = bytes32(uint256(uint160(msg.sender)));
        publicInputs[1] = bytes32(uint256(uint160(buyer)));
        publicInputs[2] = bytes32(faceAmount);
        publicInputs[3] = bytes32(uint256(dueDate));
        publicInputs[4] = commitment;
        _requireValidProof(invoiceVerifier, proof, publicInputs);

        id = ++_invoiceCount;
        usedCommitment[commitment] = true;
        invoices[id] = Invoice({
            seller: msg.sender,
            buyer: buyer,
            faceAmount: faceAmount,
            askPrice: 0,
            commitment: commitment,
            dueDate: dueDate,
            createdAt: uint64(block.timestamp),
            respondedAt: 0,
            listedAt: 0,
            financedAt: 0,
            paidAt: 0,
            status: Status.Created
        });

        emit InvoiceCreated(id, msg.sender, buyer, faceAmount, dueDate, commitment);
    }

    function confirmInvoice(uint256 id) external {
        Invoice storage invoice = _invoice(id);
        if (msg.sender != invoice.buyer) revert NotBuyer();
        if (invoice.status != Status.Created) revert WrongStatus();

        invoice.status = Status.Verified;
        invoice.respondedAt = uint64(block.timestamp);
        _mint(invoice.seller, id);
        emit InvoiceConfirmed(id);
    }

    function rejectInvoice(uint256 id) external {
        Invoice storage invoice = _invoice(id);
        if (msg.sender != invoice.buyer) revert NotBuyer();
        if (invoice.status != Status.Created) revert WrongStatus();

        invoice.status = Status.Rejected;
        invoice.respondedAt = uint64(block.timestamp);
        emit InvoiceRejected(id);
    }

    function listInvoice(uint256 id, uint256 askPrice) external {
        Invoice storage invoice = _invoice(id);
        if (_ownerOf(id) != msg.sender) revert NotHolder();
        if (invoice.status != Status.Verified) revert WrongStatus();
        if (block.timestamp >= invoice.dueDate) revert PastDue();
        if (askPrice == 0 || askPrice > invoice.faceAmount) revert InvalidPrice();

        invoice.status = Status.Listed;
        invoice.askPrice = askPrice;
        invoice.listedAt = uint64(block.timestamp);
        emit InvoiceListed(id, askPrice);
    }

    function unlistInvoice(uint256 id) external {
        Invoice storage invoice = _invoice(id);
        if (_ownerOf(id) != msg.sender) revert NotHolder();
        if (invoice.status != Status.Listed) revert WrongStatus();

        invoice.status = Status.Verified;
        invoice.askPrice = 0;
        emit InvoiceUnlisted(id);
    }

    function buyInvoice(uint256 id) external {
        Invoice storage invoice = _invoice(id);
        if (invoice.status != Status.Listed) revert WrongStatus();
        if (block.timestamp >= invoice.dueDate) revert PastDue();

        address holder = _ownerOf(id);
        if (msg.sender == holder) revert CannotBuyOwn();

        uint256 price = invoice.askPrice;
        invoice.status = Status.Financed;
        invoice.financedAt = uint64(block.timestamp);

        midr.safeTransferFrom(msg.sender, holder, price);
        _transfer(holder, msg.sender, id);
        emit InvoiceFinanced(id, msg.sender, price);
    }

    function repayInvoice(uint256 id) external {
        Invoice storage invoice = _invoice(id);
        if (msg.sender != invoice.buyer) revert NotBuyer();
        if (
            invoice.status != Status.Verified && invoice.status != Status.Listed
                && invoice.status != Status.Financed
        ) revert WrongStatus();

        address holder = _ownerOf(id);
        invoice.status = Status.Paid;
        invoice.paidAt = uint64(block.timestamp);

        midr.safeTransferFrom(msg.sender, holder, invoice.faceAmount);
        emit InvoicePaid(id, holder, invoice.faceAmount);
    }

    function submitCreditProof(uint256 threshold, uint64 attestedAt, bytes calldata proof)
        external
    {
        if (attestedAt > block.timestamp || block.timestamp - attestedAt > MAX_ATTESTATION_AGE) {
            revert AttestationExpired();
        }

        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = bytes32(uint256(uint160(msg.sender)));
        publicInputs[1] = bytes32(threshold);
        publicInputs[2] = bytes32(uint256(attestedAt));
        _requireValidProof(creditVerifier, proof, publicInputs);

        creditBadge[msg.sender] = CreditBadge({
            threshold: threshold, attestedAt: attestedAt, verifiedAt: uint64(block.timestamp)
        });
        emit CreditVerified(msg.sender, threshold, attestedAt);
    }

    function invoiceCount() external view returns (uint256) {
        return _invoiceCount;
    }

    function getInvoice(uint256 id) external view returns (InvoiceView memory) {
        return _invoiceView(id);
    }

    /// @notice Returns invoices for zero-based offsets: offset 0 starts at invoice ID 1.
    function getInvoices(uint256 offset, uint256 limit)
        external
        view
        returns (InvoiceView[] memory result)
    {
        if (offset >= _invoiceCount || limit == 0) return new InvoiceView[](0);

        uint256 available = _invoiceCount - offset;
        uint256 length = limit < available ? limit : available;
        result = new InvoiceView[](length);
        uint256 firstId = offset + 1;
        for (uint256 i; i < length; ++i) {
            result[i] = _invoiceView(firstId + i);
        }
    }

    function _invoice(uint256 id) private view returns (Invoice storage invoice) {
        if (id == 0 || id > _invoiceCount) revert WrongStatus();
        invoice = invoices[id];
    }

    function _invoiceView(uint256 id) private view returns (InvoiceView memory view_) {
        Invoice storage invoice = _invoice(id);
        view_ = InvoiceView({
            id: id,
            seller: invoice.seller,
            buyer: invoice.buyer,
            holder: _ownerOf(id),
            faceAmount: invoice.faceAmount,
            askPrice: invoice.askPrice,
            commitment: invoice.commitment,
            dueDate: invoice.dueDate,
            createdAt: invoice.createdAt,
            respondedAt: invoice.respondedAt,
            listedAt: invoice.listedAt,
            financedAt: invoice.financedAt,
            paidAt: invoice.paidAt,
            status: invoice.status
        });
    }

    function _requireValidProof(
        IVerifier verifier,
        bytes calldata proof,
        bytes32[] memory publicInputs
    ) private view {
        try verifier.verify(proof, publicInputs) returns (bool isValid) {
            if (!isValid) revert InvalidProof();
        } catch {
            revert InvalidProof();
        }
    }

    /// @dev OZ v5 passes nonzero auth for user transfers and address(0) for internal mint/transfer.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        if (auth != address(0)) revert TransfersDisabled();
        return super._update(to, tokenId, auth);
    }
}
