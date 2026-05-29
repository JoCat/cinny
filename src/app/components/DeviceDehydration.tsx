import { useCallback, useEffect, useRef } from 'react';
import { CryptoApi } from 'matrix-js-sdk/lib/crypto-api';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { useCrossSigningActive } from '../hooks/useCrossSigning';
import { useSecretStorageDefaultKeyId } from '../hooks/useSecretStorage';

export const startDeviceDehydration = async (crypto: CryptoApi): Promise<boolean> => {
  const [supported, crossSigningReady, secretStorageReady] = await Promise.all([
    crypto.isDehydrationSupported(),
    crypto.isCrossSigningReady(),
    crypto.isSecretStorageReady(),
  ]);

  if (!supported || !crossSigningReady || !secretStorageReady) return false;

  await crypto.startDehydration({
    rehydrate: true,
  });
  return true;
};

export function AutoStartDeviceDehydration() {
  const mx = useMatrixClient();
  const crypto = mx.getCrypto();
  const crossSigningActive = useCrossSigningActive();
  const defaultSecretStorageKeyId = useSecretStorageDefaultKeyId();
  const startedRef = useRef(false);
  const startingRef = useRef(false);
  const unsupportedRef = useRef(false);

  const startDehydration = useCallback(async () => {
    if (!crypto || startedRef.current || startingRef.current || unsupportedRef.current) return;
    if (!crossSigningActive || !defaultSecretStorageKeyId) return;

    try {
      startingRef.current = true;
      if (!(await crypto.isDehydrationSupported())) {
        unsupportedRef.current = true;
        return;
      }

      startedRef.current = await startDeviceDehydration(crypto);
    } finally {
      startingRef.current = false;
    }
  }, [crypto, crossSigningActive, defaultSecretStorageKeyId]);

  useEffect(() => {
    let disposed = false;

    startDehydration().catch((error) => {
      if (!disposed) {
        console.warn('Failed to start device dehydration.', error);
      }
    });

    return () => {
      disposed = true;
    };
  }, [startDehydration]);

  return null;
}
