// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Insurance {
    address public owner;
    uint256 public premiumAmount; // monthly premium in wei
    uint256 public policyBuyAmount;
    uint256 public constant MONTH = 30 days;

    struct Policy {
        bool active;
        uint256 nextDue;
    }

    struct Claim {
        uint256 id;
        address claimant;
        address doctor; // doctor the claimant requested
        uint256 amount; // requested payout in wei
        bool approved;
        bool paid;
    }

    mapping(address => Policy) public policies;
    mapping(address => bool) public authorisedDoctor;
    mapping(uint256 => Claim) public claims;
    uint256 public nextClaimId;

    event PolicyBought(address indexed who, uint256 nextDue);
    event PremiumPaid(address indexed who, uint256 nextDue);
    event PolicyCancelled(address indexed who, uint256 when);
    event ClaimSubmitted(
        uint256 indexed id,
        address indexed claimant,
        address indexed doctor,
        uint256 amount
    );
    event ClaimApproved(
        uint256 indexed id,
        address indexed doctor,
        uint256 amount
    );
    event Withdraw(address indexed by, uint256 amount);
    event DoctorAdded(address indexed doctor);
    event DoctorRemoved(address indexed doctor);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorisedDoctor() {
        require(authorisedDoctor[msg.sender], "Not an authorised doctor");
        _;
    }

    constructor(
        uint256 _premiumAmountWei,
        uint256 _policyBuyAmount,
        address[] memory initialDoctors
    ) {
        owner = msg.sender;
        premiumAmount = _premiumAmountWei;
        policyBuyAmount = _policyBuyAmount;
        for (uint i = 0; i < initialDoctors.length; i++) {
            authorisedDoctor[initialDoctors[i]] = true;
            emit DoctorAdded(initialDoctors[i]);
        }
    }

    function buyPolicy() external payable {
        require(!policies[msg.sender].active, "Policy already active");
        require(msg.value == policyBuyAmount, "Send exact amount");

        // activate policy
        policies[msg.sender].active = true;
        policies[msg.sender].nextDue = block.timestamp + MONTH;

        emit PolicyBought(msg.sender, policies[msg.sender].nextDue);
    }

    function payPremium() external payable {
        Policy storage p = policies[msg.sender];
        require(p.active, "No active policy");
        require(block.timestamp <= p.nextDue, "Policy expired - cancelled");
        require(msg.value == premiumAmount, "Send exact premium");

        // extend nextDue by one month
        p.nextDue = p.nextDue + MONTH;

        emit PremiumPaid(msg.sender, p.nextDue);
    }

    function enforceCancellation(address user) public {
        Policy storage p = policies[user];
        if (p.active && block.timestamp > p.nextDue) {
            p.active = false;
            emit PolicyCancelled(user, block.timestamp);
        }
    }

    function submitClaim(
        address doctor,
        uint256 amountWei
    ) external returns (uint256) {
        // auto-cancel if overdue
        enforceCancellation(msg.sender);

        Policy storage p = policies[msg.sender];
        require(p.active, "Policy not active");
        require(block.timestamp <= p.nextDue, "Policy expired");

        require(authorisedDoctor[doctor], "Doctor not authorised");

        uint256 id = nextClaimId++;
        claims[id] = Claim({
            id: id,
            claimant: msg.sender,
            doctor: doctor,
            amount: amountWei,
            approved: false,
            paid: false
        });

        emit ClaimSubmitted(id, msg.sender, doctor, amountWei);
        return id;
    }

    function approveClaim(uint256 claimId) external onlyAuthorisedDoctor {
        Claim storage c = claims[claimId];
        require(c.claimant != address(0), "Invalid claim");
        require(!c.approved, "Already approved");
        require(!c.paid, "Already paid");
        require(c.doctor == msg.sender, "Doctor not assigned to this claim");

        uint256 toPay = c.amount;
        require(
            address(this).balance >= toPay,
            "Insufficient contract balance"
        );

        // mark approved & paid then transfer (prevent reentrancy)
        c.approved = true;
        c.paid = true;

        // transfer
        (bool sent, ) = c.claimant.call{value: toPay}("");
        require(sent, "Transfer failed");

        emit ClaimApproved(claimId, msg.sender, toPay);
    }

    function withdraw(uint256 amountWei) external onlyOwner {
        require(address(this).balance >= amountWei, "Insufficient balance");
        (bool sent, ) = owner.call{value: amountWei}("");
        require(sent, "Withdraw failed");
        emit Withdraw(msg.sender, amountWei);
    }

    function addDoctor(address doctor) external onlyOwner {
        authorisedDoctor[doctor] = true;
        emit DoctorAdded(doctor);
    }

    function removeDoctor(address doctor) external onlyOwner {
        authorisedDoctor[doctor] = false;
        emit DoctorRemoved(doctor);
    }

    function isPolicyActiveView(address user) external view returns (bool) {
        Policy storage p = policies[user];
        return (p.active && block.timestamp <= p.nextDue);
    }

    receive() external payable {}
}
