// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IUEAFactory
 * @notice Interface for Push Chain's Universal Execution Account Factory
 * @dev Used to detect the origin chain of contributors
 */
interface IUEAFactory {
    /**
     * @notice Struct representing a universal account identifier
     * @param chainNamespace The namespace of the chain (e.g., "eip155", "solana")
     * @param chainId The specific chain ID within the namespace
     * @param owner The owner address on the origin chain
     */
    struct UniversalAccountId {
        string chainNamespace;
        string chainId;
        bytes owner;
    }

    /**
     * @notice Get the origin chain information for a Universal Execution Account
     * @param addr The address to check
     * @return account The universal account identifier containing origin chain info
     * @return isUEA Boolean indicating if the address is a UEA (true) or native Push Chain address (false)
     */
    function getOriginForUEA(address addr)
        external
        view
        returns (UniversalAccountId memory account, bool isUEA);
}
