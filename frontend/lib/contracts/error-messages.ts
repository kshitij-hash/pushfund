/**
 * Error message mapping for smart contract errors
 * Converts technical error messages to user-friendly messages
 */

export interface ParsedError {
  title: string;
  message: string;
  action?: string;
}

/**
 * Parse contract error and return user-friendly message
 */
export function parseContractError(error: unknown): ParsedError {
  const errorString = String(error).toLowerCase();

  // Campaign creation errors
  if (errorString.includes('duration must be 7-90 days')) {
    return {
      title: 'Invalid Campaign Duration',
      message: 'Campaign duration must be between 7 and 90 days.',
      action: 'Please adjust your campaign duration.',
    };
  }

  if (errorString.includes('campaign creation cooldown active')) {
    return {
      title: 'Too Soon to Create Another Campaign',
      message: 'You must wait 24 hours between creating campaigns.',
      action: 'Please try again tomorrow.',
    };
  }

  if (errorString.includes('max campaigns limit reached')) {
    return {
      title: 'Campaign Limit Reached',
      message: 'You have reached the maximum of 10 campaigns per creator.',
      action: 'Please complete or close existing campaigns before creating new ones.',
    };
  }

  // Contribution errors
  if (errorString.includes('campaign not active')) {
    return {
      title: 'Campaign Not Active',
      message: 'This campaign is no longer accepting contributions.',
      action: 'The campaign may have ended or reached its goal.',
    };
  }

  if (errorString.includes('contribution too small') || errorString.includes('amount must be greater than 0')) {
    return {
      title: 'Invalid Contribution Amount',
      message: 'Contribution amount must be greater than 0.',
      action: 'Please enter a valid amount.',
    };
  }

  // Withdrawal errors
  if (errorString.includes('only creator')) {
    return {
      title: 'Unauthorized',
      message: 'Only the campaign creator can withdraw funds.',
      action: 'Please make sure you are connected with the creator wallet.',
    };
  }

  if (errorString.includes('goal not reached')) {
    return {
      title: 'Goal Not Reached',
      message: 'Funds cannot be withdrawn until the campaign goal is reached.',
      action: 'Wait for more contributors or end the campaign to allow refunds.',
    };
  }

  if (errorString.includes('already withdrawn')) {
    return {
      title: 'Already Withdrawn',
      message: 'Funds have already been withdrawn from this campaign.',
      action: 'No further action needed.',
    };
  }

  if (errorString.includes('campaign still active')) {
    return {
      title: 'Campaign Still Active',
      message: 'Cannot withdraw funds while campaign is still active.',
      action: 'Wait for the campaign deadline to pass.',
    };
  }

  // Refund errors
  if (errorString.includes('goal was reached')) {
    return {
      title: 'Campaign Was Successful',
      message: 'Refunds are not available for successful campaigns.',
      action: 'The campaign creator can withdraw the funds.',
    };
  }

  if (errorString.includes('no contribution found') || errorString.includes('nothing to refund')) {
    return {
      title: 'No Contribution Found',
      message: 'You have not contributed to this campaign.',
      action: 'Only contributors can claim refunds.',
    };
  }

  if (errorString.includes('already refunded')) {
    return {
      title: 'Already Refunded',
      message: 'You have already claimed your refund for this campaign.',
      action: 'No further action needed.',
    };
  }

  // Wallet connection errors
  if (errorString.includes('user rejected') || errorString.includes('user denied')) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction in your wallet.',
      action: 'Please try again if you want to proceed.',
    };
  }

  if (errorString.includes('insufficient funds') || errorString.includes('insufficient balance')) {
    return {
      title: 'Insufficient Funds',
      message: 'You do not have enough funds in your wallet for this transaction.',
      action: 'Please add funds to your wallet and try again.',
    };
  }

  // Network errors
  if (errorString.includes('network') || errorString.includes('rpc')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the blockchain network.',
      action: 'Please check your internet connection and try again.',
    };
  }

  // Gas estimation errors
  if (errorString.includes('gas')) {
    return {
      title: 'Transaction Failed',
      message: 'Unable to estimate gas or transaction would fail.',
      action: 'Please check the transaction parameters and try again.',
    };
  }

  // Default error
  return {
    title: 'Transaction Failed',
    message: 'An unexpected error occurred while processing your transaction.',
    action: 'Please try again or contact support if the problem persists.',
  };
}

/**
 * Display user-friendly error toast
 */
export function displayError(error: unknown): void {
  const parsed = parseContractError(error);

  // For now, just return the formatted message
  // The calling code will handle displaying it via toast
  console.error('Contract error:', {
    original: error,
    parsed,
  });
}

/**
 * Get a simple error message string
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseContractError(error);
  return `${parsed.message}${parsed.action ? ' ' + parsed.action : ''}`;
}
