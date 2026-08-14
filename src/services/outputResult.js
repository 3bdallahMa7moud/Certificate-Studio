export const OUTPUT_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

function normalizeError(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  return error.message || String(error);
}

export function outputSuccess(details = {}) {
  return {
    status: OUTPUT_STATUS.SUCCESS,
    ...details,
    error: null,
  };
}

export function outputFailed(error, details = {}) {
  return {
    status: OUTPUT_STATUS.FAILED,
    ...details,
    error: normalizeError(error) || 'تعذّر إكمال العملية.',
  };
}

export function outputCancelled(reason = 'cancelled', details = {}) {
  return {
    status: OUTPUT_STATUS.CANCELLED,
    ...details,
    reason,
    error: null,
  };
}

export function isOutputSuccess(result) {
  return result?.status === OUTPUT_STATUS.SUCCESS;
}
