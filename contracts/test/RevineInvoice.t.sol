// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIDR} from "../src/MockIDR.sol";
import {RevineInvoice} from "../src/RevineInvoice.sol";
import {AlwaysTrueVerifier} from "../src/verifiers/AlwaysTrueVerifier.sol";
import {IVerifier} from "../src/verifiers/IVerifier.sol";

contract MockVerifier is IVerifier {
    bool public shouldRevert;
    bool public result;

    constructor(bool result_, bool shouldRevert_) {
        result = result_;
        shouldRevert = shouldRevert_;
    }

    function verify(bytes calldata, bytes32[] calldata) external view returns (bool) {
        require(!shouldRevert, "verification reverted");
        return result;
    }
}

contract RevineInvoiceTest is Test {
    uint256 private constant FACE_AMOUNT = 10_000_000;
    uint256 private constant ASK_PRICE = 9_700_000;
    uint256 private constant FAUCET_AMOUNT = 100_000_000;
    uint64 private constant TERM = 30 days;

    address private constant SELLER = address(0xA11CE);
    address private constant BUYER = address(0xB0B);
    address private constant FINANCIER = address(0xCAFE);
    address private constant OTHER = address(0xD00D);

    MockIDR private midr;
    AlwaysTrueVerifier private verifier;
    RevineInvoice private invoice;

    function setUp() public {
        vm.warp(1_800_000_000);
        midr = new MockIDR();
        verifier = new AlwaysTrueVerifier();
        invoice = new RevineInvoice(
            IERC20(address(midr)), IVerifier(address(verifier)), IVerifier(address(verifier))
        );

        _faucet(SELLER);
        _faucet(BUYER);
        _faucet(FINANCIER);
        _faucet(OTHER);
    }

    function testFullFlowAndExactBalances() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(1)));
        assertEq(invoice.invoiceCount(), 1);
        assertEq(invoice.getInvoice(id).holder, address(0));

        _confirm(id, BUYER);
        assertEq(invoice.ownerOf(id), SELLER);

        _list(id, SELLER, ASK_PRICE);
        assertEq(invoice.ownerOf(id), SELLER);

        vm.prank(FINANCIER);
        invoice.buyInvoice(id);
        assertEq(invoice.ownerOf(id), FINANCIER);
        assertEq(midr.balanceOf(SELLER), FAUCET_AMOUNT + ASK_PRICE);
        assertEq(midr.balanceOf(FINANCIER), FAUCET_AMOUNT - ASK_PRICE);

        _repay(id, BUYER);
        assertEq(invoice.ownerOf(id), FINANCIER);
        assertEq(midr.balanceOf(SELLER), FAUCET_AMOUNT + ASK_PRICE);
        assertEq(midr.balanceOf(FINANCIER), FAUCET_AMOUNT + FACE_AMOUNT - ASK_PRICE);
        assertEq(midr.balanceOf(BUYER), FAUCET_AMOUNT - FACE_AMOUNT);

        RevineInvoice.InvoiceView memory view_ = invoice.getInvoice(id);
        assertEq(uint256(view_.status), uint256(RevineInvoice.Status.Paid));
        assertEq(view_.askPrice, ASK_PRICE);
        assertGt(view_.paidAt, 0);
        assertEq(view_.holder, FINANCIER);
    }

    function testRepayWhileVerifiedPaysSeller() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(2)));
        _confirm(id, BUYER);
        _repay(id, BUYER);

        assertEq(invoice.ownerOf(id), SELLER);
        assertEq(midr.balanceOf(SELLER), FAUCET_AMOUNT + FACE_AMOUNT);
        assertEq(uint256(invoice.getInvoice(id).status), uint256(RevineInvoice.Status.Paid));
    }

    function testRepayWhileListedEndsListingAndPaysSeller() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(3)));
        _confirm(id, BUYER);
        _list(id, SELLER, ASK_PRICE);
        _repay(id, BUYER);

        RevineInvoice.InvoiceView memory view_ = invoice.getInvoice(id);
        assertEq(uint256(view_.status), uint256(RevineInvoice.Status.Paid));
        assertEq(view_.holder, SELLER);
        assertEq(view_.askPrice, ASK_PRICE);
        assertEq(midr.balanceOf(SELLER), FAUCET_AMOUNT + FACE_AMOUNT);
    }

    function testUnlistResetsPriceAndReturnsToVerified() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(4)));
        _confirm(id, BUYER);
        _list(id, SELLER, ASK_PRICE);

        vm.prank(SELLER);
        invoice.unlistInvoice(id);

        RevineInvoice.InvoiceView memory view_ = invoice.getInvoice(id);
        assertEq(uint256(view_.status), uint256(RevineInvoice.Status.Verified));
        assertEq(view_.askPrice, 0);
    }

    function testCreateRejectsZeroOrSelfBuyer() public {
        uint64 dueDate = _dueDate();
        vm.expectRevert(RevineInvoice.InvalidBuyer.selector);
        vm.prank(SELLER);
        invoice.createInvoice(address(0), FACE_AMOUNT, dueDate, bytes32(uint256(10)), "");

        vm.expectRevert(RevineInvoice.InvalidBuyer.selector);
        vm.prank(SELLER);
        invoice.createInvoice(SELLER, FACE_AMOUNT, dueDate, bytes32(uint256(11)), "");
    }

    function testCreateRejectsZeroAndTooLargeAmounts() public {
        uint64 dueDate = _dueDate();
        vm.expectRevert(RevineInvoice.InvalidAmount.selector);
        vm.prank(SELLER);
        invoice.createInvoice(BUYER, 0, dueDate, bytes32(uint256(12)), "");

        vm.expectRevert(RevineInvoice.InvalidAmount.selector);
        vm.prank(SELLER);
        invoice.createInvoice(BUYER, 10_000_000_001, dueDate, bytes32(uint256(13)), "");
    }

    function testCreateRejectsDueDateOutsideBounds() public {
        vm.expectRevert(RevineInvoice.InvalidDueDate.selector);
        vm.prank(SELLER);
        invoice.createInvoice(BUYER, FACE_AMOUNT, uint64(block.timestamp), bytes32(uint256(14)), "");

        vm.expectRevert(RevineInvoice.InvalidDueDate.selector);
        vm.prank(SELLER);
        invoice.createInvoice(
            BUYER, FACE_AMOUNT, uint64(block.timestamp - 1), bytes32(uint256(15)), ""
        );

        vm.expectRevert(RevineInvoice.InvalidDueDate.selector);
        vm.prank(SELLER);
        invoice.createInvoice(
            BUYER, FACE_AMOUNT, uint64(block.timestamp + 366 days + 1), bytes32(uint256(16)), ""
        );
    }

    function testCreateRejectsUsedCommitment() public {
        bytes32 commitment = bytes32(uint256(17));
        _create(SELLER, BUYER, commitment);

        vm.expectRevert(RevineInvoice.CommitmentUsed.selector);
        vm.prank(OTHER);
        invoice.createInvoice(BUYER, FACE_AMOUNT, _dueDate(), commitment, "");
    }

    function testOnlyBuyerCanConfirmRejectOrRepay() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(18)));

        vm.expectRevert(RevineInvoice.NotBuyer.selector);
        vm.prank(OTHER);
        invoice.confirmInvoice(id);

        vm.expectRevert(RevineInvoice.NotBuyer.selector);
        vm.prank(OTHER);
        invoice.rejectInvoice(id);

        vm.expectRevert(RevineInvoice.NotBuyer.selector);
        vm.prank(OTHER);
        invoice.repayInvoice(id);
    }

    function testWrongStatusOnRepeatedConfirmationAndRepayment() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(19)));
        _confirm(id, BUYER);

        vm.expectRevert(RevineInvoice.WrongStatus.selector);
        vm.prank(BUYER);
        invoice.confirmInvoice(id);

        _repay(id, BUYER);
        vm.expectRevert(RevineInvoice.WrongStatus.selector);
        vm.prank(BUYER);
        invoice.repayInvoice(id);
    }

    function testOnlyHolderCanListOrUnlist() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(20)));
        _confirm(id, BUYER);

        vm.expectRevert(RevineInvoice.NotHolder.selector);
        vm.prank(OTHER);
        invoice.listInvoice(id, ASK_PRICE);

        _list(id, SELLER, ASK_PRICE);
        vm.expectRevert(RevineInvoice.NotHolder.selector);
        vm.prank(OTHER);
        invoice.unlistInvoice(id);
    }

    function testListingRejectsZeroOrAboveFacePrice() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(21)));
        _confirm(id, BUYER);

        vm.expectRevert(RevineInvoice.InvalidPrice.selector);
        vm.prank(SELLER);
        invoice.listInvoice(id, 0);

        vm.expectRevert(RevineInvoice.InvalidPrice.selector);
        vm.prank(SELLER);
        invoice.listInvoice(id, FACE_AMOUNT + 1);
    }

    function testListingAndBuyingAreBlockedAtDueDate() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(22)));
        _confirm(id, BUYER);
        _list(id, SELLER, ASK_PRICE);
        uint64 dueDate = invoice.getInvoice(id).dueDate;
        vm.warp(dueDate);

        vm.expectRevert(RevineInvoice.PastDue.selector);
        vm.prank(FINANCIER);
        invoice.buyInvoice(id);

        uint256 anotherId = _create(SELLER, OTHER, bytes32(uint256(23)));
        _confirm(anotherId, OTHER);
        uint64 anotherDueDate = invoice.getInvoice(anotherId).dueDate;
        vm.warp(anotherDueDate);

        vm.expectRevert(RevineInvoice.PastDue.selector);
        vm.prank(SELLER);
        invoice.listInvoice(anotherId, ASK_PRICE);
    }

    function testHolderCannotBuyOwnListing() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(24)));
        _confirm(id, BUYER);
        _list(id, SELLER, ASK_PRICE);

        vm.expectRevert(RevineInvoice.CannotBuyOwn.selector);
        vm.prank(SELLER);
        invoice.buyInvoice(id);
    }

    function testUserTransfersAreBlockedButProtocolPurchaseWorks() public {
        uint256 id = _create(SELLER, BUYER, bytes32(uint256(25)));
        _confirm(id, BUYER);

        vm.expectRevert(RevineInvoice.TransfersDisabled.selector);
        vm.prank(SELLER);
        invoice.transferFrom(SELLER, FINANCIER, id);

        vm.expectRevert(RevineInvoice.TransfersDisabled.selector);
        vm.prank(SELLER);
        invoice.safeTransferFrom(SELLER, FINANCIER, id);
    }

    function testOldOrFutureAttestationIsRejected() public {
        vm.expectRevert(RevineInvoice.AttestationExpired.selector);
        vm.prank(SELLER);
        invoice.submitCreditProof(100_000_000, uint64(block.timestamp - 30 days - 1), "");

        vm.expectRevert(RevineInvoice.AttestationExpired.selector);
        vm.prank(SELLER);
        invoice.submitCreditProof(100_000_000, uint64(block.timestamp + 1), "");
    }

    function testCreditBadgeStoresThresholdAndTimes() public {
        vm.prank(SELLER);
        invoice.submitCreditProof(100_000_000, uint64(block.timestamp), "");

        (uint256 threshold, uint64 attestedAt, uint64 verifiedAt) = invoice.creditBadge(SELLER);
        assertEq(threshold, 100_000_000);
        assertEq(attestedAt, block.timestamp);
        assertEq(verifiedAt, block.timestamp);
    }

    function testFalseAndRevertingInvoiceVerifiersBecomeInvalidProof() public {
        MockVerifier falseVerifier = new MockVerifier(false, false);
        RevineInvoice withFalseVerifier = new RevineInvoice(
            IERC20(address(midr)), IVerifier(address(falseVerifier)), IVerifier(address(verifier))
        );

        vm.expectRevert(RevineInvoice.InvalidProof.selector);
        vm.prank(SELLER);
        withFalseVerifier.createInvoice(BUYER, FACE_AMOUNT, _dueDate(), bytes32(uint256(26)), "");

        MockVerifier revertingVerifier = new MockVerifier(true, true);
        RevineInvoice withRevertingVerifier = new RevineInvoice(
            IERC20(address(midr)),
            IVerifier(address(revertingVerifier)),
            IVerifier(address(verifier))
        );

        vm.expectRevert(RevineInvoice.InvalidProof.selector);
        vm.prank(SELLER);
        withRevertingVerifier.createInvoice(
            BUYER, FACE_AMOUNT, _dueDate(), bytes32(uint256(27)), ""
        );
    }

    function testFalseAndRevertingCreditVerifiersBecomeInvalidProof() public {
        MockVerifier falseVerifier = new MockVerifier(false, false);
        RevineInvoice withFalseVerifier = new RevineInvoice(
            IERC20(address(midr)), IVerifier(address(verifier)), IVerifier(address(falseVerifier))
        );

        vm.expectRevert(RevineInvoice.InvalidProof.selector);
        vm.prank(SELLER);
        withFalseVerifier.submitCreditProof(100_000_000, uint64(block.timestamp), "");

        MockVerifier revertingVerifier = new MockVerifier(true, true);
        RevineInvoice withRevertingVerifier = new RevineInvoice(
            IERC20(address(midr)),
            IVerifier(address(verifier)),
            IVerifier(address(revertingVerifier))
        );

        vm.expectRevert(RevineInvoice.InvalidProof.selector);
        vm.prank(SELLER);
        withRevertingVerifier.submitCreditProof(100_000_000, uint64(block.timestamp), "");
    }

    function testInvoiceReadsSupportZeroBasedPagination() public {
        _create(SELLER, BUYER, bytes32(uint256(28)));
        _create(SELLER, BUYER, bytes32(uint256(29)));
        _create(SELLER, BUYER, bytes32(uint256(30)));

        RevineInvoice.InvoiceView[] memory firstPage = invoice.getInvoices(0, 2);
        assertEq(firstPage.length, 2);
        assertEq(firstPage[0].id, 1);
        assertEq(firstPage[1].id, 2);

        RevineInvoice.InvoiceView[] memory secondPage = invoice.getInvoices(2, 20);
        assertEq(secondPage.length, 1);
        assertEq(secondPage[0].id, 3);
        assertEq(invoice.getInvoices(3, 1).length, 0);
        assertEq(invoice.getInvoices(0, 0).length, 0);
    }

    function testUnknownInvoiceReadReverts() public {
        vm.expectRevert(RevineInvoice.WrongStatus.selector);
        invoice.getInvoice(1);
    }

    function _create(address seller, address buyer, bytes32 commitment)
        private
        returns (uint256 id)
    {
        vm.prank(seller);
        id = invoice.createInvoice(buyer, FACE_AMOUNT, _dueDate(), commitment, "");
    }

    function _confirm(uint256 id, address buyer) private {
        vm.prank(buyer);
        invoice.confirmInvoice(id);
    }

    function _list(uint256 id, address seller, uint256 askPrice) private {
        vm.prank(seller);
        invoice.listInvoice(id, askPrice);
    }

    function _repay(uint256 id, address buyer) private {
        vm.prank(buyer);
        invoice.repayInvoice(id);
    }

    function _faucet(address account) private {
        vm.prank(account);
        midr.faucet();
        vm.prank(account);
        midr.approve(address(invoice), type(uint256).max);
    }

    function _dueDate() private view returns (uint64) {
        return uint64(block.timestamp + TERM);
    }
}
