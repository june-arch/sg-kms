export enum Constants {
  ALGO_CMAC_256 = "aes-256-cbc",
  ALGO_GCM_256 = "aes-256-gcm",
  AES_BLOCK_SIZE = 16,
  AES_256_KEY_LENGTH = 32,
  SHA256_HASH_LENGTH = 32,
  BLOCK_CIPHER_SIZE = 16,
  GCM_IV_LENGTH = 12,
  TAG_LENGTH = 16,
}

export enum HashAlgo {
  CMAC,
  HMAC,
  GMAC,
}