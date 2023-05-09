import fetch from "node-fetch";
import fs from "fs";
import https from "https";
import { Constants } from "./Constants";
import logger from "./Logger";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export interface RequestGenerateKeyPair {
  slotId: number;
  sessionToken: string;
  wrappingKeyId: string;
  algo: string;
  algoLength: number;
}

export interface ResponseGenerateKeyPair {
  wrappedPrivateKey: string;
  publicKeyOrCert: string;
}

export interface RequestLogin {
  slotId: number;
  password: string;
}

export interface ResponseLogin {
  sessionToken: string;
  agentDN: string;
  lastUsedTime: number;
  idleTimeoutInMins: number;
  expiredAt: number;
}

export interface RequestGenerateRandomBytes {
  slotId: number;
  sessionToken: string;
  length: number;
}

export interface ResponseGenerateRandomBytes {
  random: number[];
}

export interface Source {
  format: string;
  wrappingKeyId: string;
  wrappedPrivateKey: string;
  sessionKeyAlgo: string;
  macAlgo: string;
  ciphertext: string;
}

export interface Destination {
  format: string;
  encryptionKeyId: string;
  algo: string;
}

export interface CompareWith {
  format: string;
  encryptionKeyId: string;
  keyVersion: number;
  algo: string;
  ciphertext: string;
  iv: string;
  mac: string;
}

export interface RequestTranslate {
  slotId: number;
  sessionToken: string;
  source: Source;
  destination: Destination;
}
export interface ResponseTranslate {
  keyVersion: number;
  ciphertext: string;
  mac: string;
  iv: string;
}

export interface RequestCompare {
  slotId: number;
  sessionToken: string;
  source: Source;
  compareWith: CompareWith;
}
export interface ResponseCompare {
  equals: boolean;
}

export interface RequestSeal {
  sessionToken: string;
  slotId: number;
  keyId: string;
  plaintext: string[];
}

export interface ResponseSeal {
  ciphertext: string[];
}

export interface RequestUnseal {
  sessionToken: string;
  slotId: number;
  keyId: string;
  ciphertext: string[];
}

export interface ResponseUnseal {
  plaintext: string[];
}

async function request(endpoint: string, body: any) {
  logger.debug(JSON.stringify(body));
  const url = `https://${process.env.LCEV_HOSTNAME}:${process.env.PORT}${endpoint}`;

  const options = {
    cert: fs.readFileSync(process.env.CERT as string, "utf-8"),
    key: fs.readFileSync(process.env.PRIVATE_KEY as string, "utf-8"),
    rejectUnauthorized: false,
  };

  const sslConfiguredAgent = new https.Agent(options);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    agent: sslConfiguredAgent,
  });
  const res: any = await response.json();
  logger.debug(JSON.stringify(res));
  return res;
}

export async function login(
  requestLogin: RequestLogin
): Promise<ResponseLogin> {
  const loginResponse = await request("/v1.0/agent/login", requestLogin);
  if (loginResponse.fault) throw new Error(loginResponse.fault.code);
  return loginResponse.result;
}

export async function generateKeyPairExternal(
  requestgenerateKeyPair: RequestGenerateKeyPair
): Promise<ResponseGenerateKeyPair> {
  const generateKeyPairResponse = await request(
    "/v1.0/external/keypair/generate",
    requestgenerateKeyPair
  );
  if (generateKeyPairResponse.fault)
    throw new Error(generateKeyPairResponse.fault.code);
  return generateKeyPairResponse.result;
}

export async function generateRandomBytes(
  requestGenerateRandomBytes: RequestGenerateRandomBytes
): Promise<ResponseGenerateRandomBytes> {
  const generateRandomNumberResponse = await request(
    "/v1.0/rng",
    requestGenerateRandomBytes
  );
  if (generateRandomNumberResponse.fault)
    throw new Error(generateRandomNumberResponse.fault.code);
  return generateRandomNumberResponse.result;
}

/**
 *
 * @param requestTranslate
 * @returns
 */
export async function e2eeTranslate(
  requestTranslate: RequestTranslate
): Promise<ResponseTranslate> {
  console.log(requestTranslate);
  const translateResponse = await request(
    "/v1.0/e2ee/translate",
    requestTranslate
  );
  
  if (translateResponse.fault) throw new Error(translateResponse.fault.code);
  console.log(translateResponse.result)
  return translateResponse.result;
}

export async function seal(requestSeal: RequestSeal): Promise<ResponseSeal> {
  const sealResponse = await request("/v1.0/seal", requestSeal);
  if (sealResponse.fault) throw new Error(sealResponse.fault.code);
  return sealResponse.result;
}

export async function unseal(
  requestUnseal: RequestUnseal
): Promise<ResponseUnseal> {
  const unsealResponse = await request("/v1.0/unseal", requestUnseal);
  if (unsealResponse.fault) throw new Error(unsealResponse.fault.code);
  return unsealResponse.result;
}

export async function e2eeCompare(
  requestCompare: RequestCompare
): Promise<ResponseCompare> {
  const compareResponse = await request("/v1.0/e2ee/compare", requestCompare);
  if (compareResponse.fault) throw new Error(compareResponse.fault.code);

  return compareResponse.result;
}