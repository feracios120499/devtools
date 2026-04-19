// Compact OID dictionary used by the ASN.1 viewer to turn raw dotted numbers
// into human-readable labels in the tree and the detected-type summary.
// Covers the most common entries encountered when parsing X.509 certificates,
// CSRs, PKCS#7/CMS envelopes, PKCS#8 private keys and SPKI public keys.

export const OID_DICTIONARY: Record<string, string> = {
  // Relative Distinguished Name (RDN) attributes — RFC 4519 / RFC 5280
  '2.5.4.3': 'commonName (CN)',
  '2.5.4.4': 'surname (SN)',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'countryName (C)',
  '2.5.4.7': 'localityName (L)',
  '2.5.4.8': 'stateOrProvinceName (ST)',
  '2.5.4.9': 'streetAddress',
  '2.5.4.10': 'organizationName (O)',
  '2.5.4.11': 'organizationalUnitName (OU)',
  '2.5.4.12': 'title',
  '2.5.4.13': 'description',
  '2.5.4.15': 'businessCategory',
  '2.5.4.17': 'postalCode',
  '2.5.4.41': 'name',
  '2.5.4.42': 'givenName (GN)',
  '2.5.4.43': 'initials',
  '2.5.4.44': 'generationQualifier',
  '2.5.4.45': 'uniqueIdentifier',
  '2.5.4.46': 'dnQualifier',
  '2.5.4.65': 'pseudonym',
  '2.5.4.97': 'organizationIdentifier',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.25': 'domainComponent (DC)',
  '0.9.2342.19200300.100.1.1': 'userID (UID)',

  // X.509 v3 extensions — RFC 5280
  '2.5.29.9': 'subjectDirectoryAttributes',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.15': 'keyUsage',
  '2.5.29.16': 'privateKeyUsagePeriod',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.18': 'issuerAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.20': 'cRLNumber',
  '2.5.29.21': 'cRLReasons',
  '2.5.29.23': 'holdInstructionCode',
  '2.5.29.24': 'invalidityDate',
  '2.5.29.27': 'deltaCRLIndicator',
  '2.5.29.28': 'issuingDistributionPoint',
  '2.5.29.29': 'certificateIssuer',
  '2.5.29.30': 'nameConstraints',
  '2.5.29.31': 'cRLDistributionPoints',
  '2.5.29.32': 'certificatePolicies',
  '2.5.29.32.0': 'anyPolicy',
  '2.5.29.33': 'policyMappings',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.36': 'policyConstraints',
  '2.5.29.37': 'extKeyUsage',
  '2.5.29.37.0': 'anyExtendedKeyUsage',
  '2.5.29.46': 'freshestCRL',
  '2.5.29.54': 'inhibitAnyPolicy',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess (AIA)',
  '1.3.6.1.5.5.7.1.11': 'subjectInfoAccess (SIA)',
  '1.3.6.1.5.5.7.1.24': 'tlsFeature',
  '1.3.6.1.5.5.7.1.3': 'qcStatements',

  // Extended Key Usage purposes
  '1.3.6.1.5.5.7.3.1': 'serverAuth',
  '1.3.6.1.5.5.7.3.2': 'clientAuth',
  '1.3.6.1.5.5.7.3.3': 'codeSigning',
  '1.3.6.1.5.5.7.3.4': 'emailProtection',
  '1.3.6.1.5.5.7.3.5': 'ipSecEndSystem',
  '1.3.6.1.5.5.7.3.6': 'ipSecTunnel',
  '1.3.6.1.5.5.7.3.7': 'ipSecUser',
  '1.3.6.1.5.5.7.3.8': 'timeStamping',
  '1.3.6.1.5.5.7.3.9': 'OCSPSigning',
  '1.3.6.1.4.1.311.10.3.3': 'microsoftServerGatedCrypto',
  '1.3.6.1.4.1.311.20.2.2': 'microsoftSmartcardLogon',
  '2.16.840.1.113730.4.1': 'netscapeServerGatedCrypto',

  // Access descriptors (AIA/SIA)
  '1.3.6.1.5.5.7.48.1': 'ocsp',
  '1.3.6.1.5.5.7.48.2': 'caIssuers',
  '1.3.6.1.5.5.7.48.3': 'timeStamping',
  '1.3.6.1.5.5.7.48.5': 'caRepository',

  // Public key algorithms — RFC 3279 / 5480 / 8410
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.7': 'RSAES-OAEP',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.10040.4.1': 'dsa',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '1.3.101.110': 'X25519',
  '1.3.101.111': 'X448',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',

  // Signature algorithms
  '1.2.840.113549.1.1.2': 'md2WithRSAEncryption',
  '1.2.840.113549.1.1.4': 'md5WithRSAEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.113549.1.1.14': 'sha224WithRSAEncryption',
  '1.2.840.10040.4.3': 'dsa-with-sha1',
  '2.16.840.1.101.3.4.3.1': 'dsa-with-sha224',
  '2.16.840.1.101.3.4.3.2': 'dsa-with-sha256',
  '1.2.840.10045.4.1': 'ecdsa-with-SHA1',
  '1.2.840.10045.4.3.1': 'ecdsa-with-SHA224',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',

  // Hash algorithms
  '1.2.840.113549.2.5': 'md5',
  '1.3.14.3.2.26': 'sha1',
  '2.16.840.1.101.3.4.2.1': 'sha256',
  '2.16.840.1.101.3.4.2.2': 'sha384',
  '2.16.840.1.101.3.4.2.3': 'sha512',
  '2.16.840.1.101.3.4.2.4': 'sha224',

  // Named EC curves (ANSI X9.62 / SECG / NIST)
  '1.2.840.10045.3.1.1': 'secp192r1 / prime192v1 / P-192',
  '1.2.840.10045.3.1.7': 'secp256r1 / prime256v1 / P-256',
  '1.3.132.0.10': 'secp256k1',
  '1.3.132.0.33': 'secp224r1 / P-224',
  '1.3.132.0.34': 'secp384r1 / P-384',
  '1.3.132.0.35': 'secp521r1 / P-521',
  '1.2.840.10045.1.1': 'prime-field',
  '1.2.840.10045.1.2': 'characteristic-two-field',

  // PKCS#7 / CMS content types — RFC 5652
  '1.2.840.113549.1.7.1': 'pkcs7-data',
  '1.2.840.113549.1.7.2': 'pkcs7-signedData',
  '1.2.840.113549.1.7.3': 'pkcs7-envelopedData',
  '1.2.840.113549.1.7.4': 'pkcs7-signedAndEnvelopedData',
  '1.2.840.113549.1.7.5': 'pkcs7-digestedData',
  '1.2.840.113549.1.7.6': 'pkcs7-encryptedData',
  '1.2.840.113549.1.9.16.1.9': 'cms-compressedData',
  '1.2.840.113549.1.9.16.1.17': 'cms-authEnvelopedData',

  // PKCS#9 attributes
  '1.2.840.113549.1.9.2': 'unstructuredName',
  '1.2.840.113549.1.9.3': 'contentType',
  '1.2.840.113549.1.9.4': 'messageDigest',
  '1.2.840.113549.1.9.5': 'signingTime',
  '1.2.840.113549.1.9.6': 'counterSignature',
  '1.2.840.113549.1.9.7': 'challengePassword',
  '1.2.840.113549.1.9.8': 'unstructuredAddress',
  '1.2.840.113549.1.9.14': 'extensionRequest',
  '1.2.840.113549.1.9.15': 'sMIMECapabilities',
  '1.2.840.113549.1.9.20': 'friendlyName',
  '1.2.840.113549.1.9.21': 'localKeyId',

  // PKCS#12 bag types
  '1.2.840.113549.1.12.10.1.1': 'keyBag',
  '1.2.840.113549.1.12.10.1.2': 'pkcs-8ShroudedKeyBag',
  '1.2.840.113549.1.12.10.1.3': 'certBag',
  '1.2.840.113549.1.12.10.1.4': 'crlBag',
  '1.2.840.113549.1.12.10.1.5': 'secretBag',
  '1.2.840.113549.1.12.10.1.6': 'safeContentsBag',

  // Netscape / legacy
  '2.16.840.1.113730.1.1': 'netscapeCertType',
  '2.16.840.1.113730.1.2': 'netscapeBaseUrl',
  '2.16.840.1.113730.1.13': 'netscapeComment',

  // CA/Browser Forum policy OIDs
  '2.23.140.1.1': 'cabf-extended-validation',
  '2.23.140.1.2.1': 'cabf-domain-validated',
  '2.23.140.1.2.2': 'cabf-organization-validated',
  '2.23.140.1.2.3': 'cabf-individual-validated',
};

/**
 * Resolve a dotted OID string to a human-readable label, falling back to the
 * raw OID when the dictionary does not contain an entry.
 */
export function resolveOid(oid: string | null | undefined): string {
  if (!oid) return '';
  const name = OID_DICTIONARY[oid];
  return name ? `${name} (${oid})` : oid;
}

/**
 * Return just the human-readable short label for an OID (or the OID itself
 * when no mapping is available). Useful for compact summary views.
 */
export function oidShortName(oid: string | null | undefined): string {
  if (!oid) return '';
  const name = OID_DICTIONARY[oid];
  if (!name) return oid;
  // Strip the "(XYZ)" alias block if present and return just the primary name.
  const parenIdx = name.indexOf(' (');
  return parenIdx > 0 ? name.slice(0, parenIdx) : name;
}
