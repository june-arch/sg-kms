import {
  login,
  generateKeyPairExternal,
  generateRandomBytes,
  e2eeTranslate,
  Source,
  Destination,
} from "../common/Api";
import { Constants } from "../common/Constants";
import cache from "../common/Cache";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export interface KeyPair {
  wrappedPrivateKey: string;
  publicKey: string;
  id: number;
}

/**
 * Prepare n number key pair
 * @param {number} slotId
 * @param {string} sessionToken
 * @param {number} count
 * @returns
 */
export async function prepareKeyPairs(
  slotId: number,
  sessionToken: string,
  count: number
): Promise<KeyPair[]> {
  const keyPairs: KeyPair[] = [];
  try {
    for (let index = 0; index < count; index++) {
      const result = await generateKeyPairExternal({
        slotId: slotId,
        sessionToken: sessionToken,
        wrappingKeyId: process.env.WRAPPING_KEY_ID as string,
        algo: "RSA",
        algoLength: parseInt(process.env.RSA_LENGTH as string),
      });

      const wrappedPrivateKey: string = result.wrappedPrivateKey;
      const publicKey: string = result.publicKeyOrCert;

      keyPairs.push({
        publicKey: publicKey,
        wrappedPrivateKey: wrappedPrivateKey,
        id: index,
      });
    }

    return keyPairs;
  } catch (error: any) {
    throw new Error(error);
  }
}

/**
 * Generate random number
 * @param {number} slotId
 * @param {string} sessionToken
 * @param {number} length
 * @returns
 */
export async function generateRandomBytesWrapper(
  slotId: number,
  sessionToken: string,
  length: number
) {
  const randomBytes = await generateRandomBytes({
    slotId: slotId,
    sessionToken: sessionToken,
    length: length,
  });
  return randomBytes;
}

export async function getKeyPair(index?: number): Promise<KeyPair> {
  try {
    let keyPairs: KeyPair[] = cache.get(
      process.env.KEYPAIR_KEY_NAME as string
    ) as KeyPair[];
    if (keyPairs == null) {
      const sessionToken = await getSessionToken();
      keyPairs = await prepareKeyPairs(
        parseInt(process.env.SLOT_ID as string),
        sessionToken,
        parseInt(process.env.KEYPAIR_COUNT as string)
      );
      cache.set(process.env.KEYPAIR_KEY_NAME as string, keyPairs);
    }

    const randomByte = crypto.randomInt(
      parseInt(process.env.KEYPAIR_COUNT as string)
    );
    if (index) return keyPairs[index];
    return keyPairs[randomByte];
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getSessionToken(): Promise<string> {
  try {
    let sessionToken: string = cache.get(
      process.env.SESSION_TOKEN_KEY_NAME as string
    ) as string;
    if (sessionToken == null) {
      const loginResponse = await login({
        slotId: parseInt(process.env.SLOT_ID as string),
        password: process.env.PASSWORD as string,
      });
      sessionToken = loginResponse.sessionToken;
      cache.set(
        process.env.SESSION_TOKEN_KEY_NAME as string,
        sessionToken,
        3600
      );
    }
    return sessionToken;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function e2eeTranslateWrapper(
  slotId: number,
  sessionToken: string,
  source: Source,
  destination: Destination
) {
  return await e2eeTranslate({ slotId, sessionToken, source, destination });
}

// export async function e2eeCompareWrapper(slotId, sessionToken, source, compareWith) {
//   return await e2eeCompare(slotId, sessionToken, source, compareWith);
// }