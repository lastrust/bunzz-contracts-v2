//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Vesting is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        // beneficiary of tokens after they are released
        address beneficiary;
        // cliff time - actual vesting start time
        uint256 cliff;
        // start time of the vesting period
        uint256 start;
        // duration of the vesting period in seconds
        uint256 duration;
        // duration of a slice period for the vesting in seconds. f.e. (month, if tokens are released each month)
        uint256 slicePeriodSeconds;
        // total amount of tokens to be released at the end of the vesting
        uint256 amountTotal;
        // amount of tokens released
        uint256 released;
    }

    bytes32 public constant VESTING_CREATOR = keccak256("VESTING_CREATOR");
    bytes32 public constant RELEASER = keccak256("RELEASER");

    IERC20 private token;

    mapping(address => uint256) private holdersVestingCount;
    uint256 private vestingSchedulesTotalAmount;
    bytes32[] private vestingSchedulesIds;
    mapping(bytes32 => VestingSchedule) private vestingSchedules;

    event Released(uint256 amount);
    event Revoked();

    modifier onlyIfVestingScheduleExists(bytes32 vestingScheduleId) {
        require(vestingSchedules[vestingScheduleId].start != 0, "TokenVesting: vesting schedule does not exist");
        _;
    }

    constructor(address token_) {
        require(token_ != address(0), "TokenVesting: invalid token address");
        token = IERC20(token_);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VESTING_CREATOR, msg.sender);
        _setupRole(RELEASER, msg.sender);
    }

    receive() external payable {}

    fallback() external payable {}

    function getVestingSchedulesCountByBeneficiary(address _beneficiary) external view returns (uint256) {
        return holdersVestingCount[_beneficiary];
    }

    function getVestingIdAtIndex(uint256 index) external view returns (bytes32) {
        require(index < getVestingSchedulesCount(), "TokenVesting: index out of bounds");
        return vestingSchedulesIds[index];
    }

    function getVestingScheduleByAddressAndIndex(address holder, uint256 index) external view returns (VestingSchedule memory) {
        return getVestingSchedule(computeVestingScheduleIdForAddressAndIndex(holder, index));
    }

    function getVestingSchedulesTotalAmount() external view returns (uint256) {
        return vestingSchedulesTotalAmount;
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _slicePeriodSeconds,
        uint256 _amount
    )
    external
    whenNotPaused
    onlyRole(VESTING_CREATOR)
    {
        require(_duration > 0, "TokenVesting: duration must be > 0");
        require(_amount > 0, "TokenVesting: amount must be > 0");
        require(_slicePeriodSeconds >= 1, "TokenVesting: slicePeriodSeconds must be >= 1");

        bytes32 vestingScheduleId = computeVestingScheduleIdForAddressAndIndex(_beneficiary, holdersVestingCount[_beneficiary]);
        uint256 cliff = _start + _cliff;
        vestingSchedules[vestingScheduleId] = VestingSchedule(
            _beneficiary,
            cliff,
            _start,
            _duration,
            _slicePeriodSeconds,
            _amount,
            0
        );
        vestingSchedulesTotalAmount += _amount;
        vestingSchedulesIds.push(vestingScheduleId);
        holdersVestingCount[_beneficiary]++;
    }

    function withdraw(uint256 amount, address to)
    public
    nonReentrant
    whenNotPaused
    onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(amount <= getWithdrawableAmount(), "TokenVesting: not enough withdrawable funds");
        token.safeTransfer(to, amount);
    }

    function release(bytes32 vestingScheduleId, uint256 amount) external nonReentrant whenNotPaused onlyIfVestingScheduleExists(vestingScheduleId) {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        require(msg.sender == vestingSchedule.beneficiary || hasRole(RELEASER, msg.sender), "TokenVesting: only beneficiary and RELEASER can release vested tokens");

        uint256 vestedAmount = _computeReleasableAmount(vestingSchedule);
        require(vestedAmount >= amount, "TokenVesting: not enough vested tokens to release");

        vestingSchedule.released += amount;
        vestingSchedulesTotalAmount -= amount;
        token.safeTransfer(vestingSchedule.beneficiary, amount);
    }

    function getVestingSchedulesCount() public view returns (uint256) {
        return vestingSchedulesIds.length;
    }

    function computeReleasableAmount(bytes32 vestingScheduleId) public onlyIfVestingScheduleExists(vestingScheduleId) view returns (uint256) {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        return _computeReleasableAmount(vestingSchedule);
    }

    function getVestingSchedule(bytes32 vestingScheduleId) public view returns (VestingSchedule memory) {
        return vestingSchedules[vestingScheduleId];
    }

    function getWithdrawableAmount() public view returns (uint256) {
        uint256 contractBalance = token.balanceOf(address(this));
        return (contractBalance > vestingSchedulesTotalAmount) ? contractBalance - vestingSchedulesTotalAmount : 0;
    }

    function computeNextVestingScheduleIdForHolder(address holder) public view returns (bytes32) {
        return computeVestingScheduleIdForAddressAndIndex(holder, holdersVestingCount[holder]);
    }

    function getLastVestingScheduleForHolder(address holder) public view returns (VestingSchedule memory) {
        return vestingSchedules[computeVestingScheduleIdForAddressAndIndex(holder, holdersVestingCount[holder] - 1)];
    }

    function computeVestingScheduleIdForAddressAndIndex(address holder, uint256 index) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(holder, index));
    }

    function _computeReleasableAmount(VestingSchedule storage vestingSchedule) internal view returns (uint256) {
        uint256 currentTime = getCurrentTime();
        if (currentTime < vestingSchedule.cliff) {
            return 0;
        } else if (currentTime >= vestingSchedule.start + vestingSchedule.duration) {
            return vestingSchedule.amountTotal - vestingSchedule.released;
        } else {
            uint256 timeFromStart = currentTime - vestingSchedule.start;
            uint256 secondsPerSlice = vestingSchedule.slicePeriodSeconds;
            uint256 vestedSlicePeriods = timeFromStart / secondsPerSlice;
            uint256 vestedSeconds = vestedSlicePeriods * secondsPerSlice;
            uint256 vestedAmount = (vestingSchedule.amountTotal * vestedSeconds) / vestingSchedule.duration;
            vestedAmount -= vestingSchedule.released;
            return vestedAmount;
        }
    }

    function getCurrentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
