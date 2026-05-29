import { CryptoApi } from 'matrix-js-sdk/lib/crypto-api';

export const isDehydratedDevice = async (
  api: CryptoApi,
  userId: string,
  deviceId: string
): Promise<boolean> => {
  const userDeviceInfo = await api.getUserDeviceInfo([userId], true);
  const deviceInfo = userDeviceInfo.get(userId)?.get(deviceId);

  return deviceInfo?.dehydrated === true;
};

export const verifiedDevice = async (
  api: CryptoApi,
  userId: string,
  deviceId: string
): Promise<boolean | null> => {
  if (await isDehydratedDevice(api, userId, deviceId)) {
    return true;
  }

  const status = await api.getDeviceVerificationStatus(userId, deviceId);

  if (!status) return null;

  const verified = status.crossSigningVerified;
  return verified;
};
