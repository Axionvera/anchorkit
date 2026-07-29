# Payment requests

AnchorKit payment requests are portable, JSON-safe descriptions of a Stellar
payment. They let a receiver specify the destination, amount, asset, memo, and
network without including a source account, secret key, signature, or
transaction envelope.

Version 1 is intended as the common input for the payment page and future QR or
deep-link transports. The transport is deliberately separate from the format:
`parsePaymentRequest` currently accepts a decoded object or its JSON
serialization and does not fetch a URL or make a network call.

## Version 1 format

```json
{
  "version": "1",
  "destination": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
  "amount": "25.5000000",
  "asset": {
    "type": "native",
    "code": "XLM",
    "issuer": null
  },
  "memo": {
    "type": "text",
    "value": "Invoice #84"
  },
  "network": "testnet",
  "metadata": {
    "orderId": "order-84",
    "refundable": true,
    "lineItems": 2
  },
  "expiresAt": "2030-01-01T00:00:00Z"
}
```

The top-level object is strict. Unknown fields are rejected so that misspelled
or not-yet-supported instructions cannot be silently ignored.

| Field         | Required | Rules                                                                                                                                                                |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`     | Yes      | The string `"1"`. Other values return an unsupported-version error.                                                                                                  |
| `destination` | Yes      | A 56-character Stellar `G...` public account key.                                                                                                                    |
| `amount`      | Yes      | A positive decimal string with at most 7 decimal places and within AnchorKit's configured payment limits. Never encode an amount as a JSON number.                   |
| `asset`       | Yes      | Native XLM (`{"type":"native","code":"XLM","issuer":null}`) or an issued asset with an alphanumeric 1–12 character code and Stellar issuer public key.               |
| `memo`        | No       | An AnchorKit memo object. Text is limited to 28 UTF-8 bytes; IDs contain only decimal digits; hash and return memos contain exactly 64 hexadecimal characters.       |
| `network`     | Yes      | `testnet`, `mainnet`, or `futurenet`. Other values return an unsupported-network error. Parsing mainnet data does not enable mainnet network access.                 |
| `metadata`    | No       | At most 20 entries. Keys are 1–64 characters; values are scalar strings (up to 512 characters), finite numbers, or booleans. Nested objects and arrays are rejected. |
| `expiresAt`   | No       | An ISO-8601 timestamp with a timezone offset. A request is expired when this instant is equal to or earlier than the parser's clock.                                 |

## Parse a request

```typescript
import { parsePaymentRequest } from "@anchorkit/stellar-kit";

const result = parsePaymentRequest(untrustedJson);

if (!result.success) {
  console.error(result.error.code, result.error.message);
} else {
  const request = result.data;
  // Show the destination, asset, amount, memo, and network for user review.
}
```

For deterministic tests or clock-controlled consumers, pass a `Date`:

```typescript
const result = parsePaymentRequest(payload, {
  now: new Date("2029-01-01T00:00:00Z"),
});
```

Successful results contain a typed `PaymentRequest`. Failures use one of these
stable error codes:

| Code                                  | Meaning                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `PAYMENT_REQUEST_MALFORMED`           | JSON decoding or field validation failed. Schema failures include field-level `issues`. |
| `PAYMENT_REQUEST_EXPIRED`             | `expiresAt` is not later than the parser clock.                                         |
| `PAYMENT_REQUEST_UNSUPPORTED_VERSION` | The request declares a version other than `"1"`.                                        |
| `PAYMENT_REQUEST_UNSUPPORTED_NETWORK` | The request names a network AnchorKit does not recognize.                               |

`isPaymentRequestValid(input, options)` is a boolean convenience wrapper around
the same decoding, schema, and expiry checks.

## Use in the web payment page

Paste a request into **Import payment request** on `/payments` and choose
**Parse & apply request**. A valid request populates the destination, amount,
asset, memo, and active network in the existing intent builder. The page shows
typed parser feedback for invalid requests and still requires the user to
review readiness results; importing does not sign or submit a transaction.

## Trust and safety

- Treat every request and all metadata as untrusted. Metadata is informational
  and must not be interpreted as a callback, command, or authorization.
- Never place secret keys, signatures, or authentication tokens in a request.
- Confirm the destination, amount, asset, memo, and network with the user before
  signing.
- Parsing a request performs no network operation. Any later mainnet operation
  remains subject to AnchorKit's explicit mainnet gate.
- QR codes and deep links should carry this format without weakening size
  limits, strict validation, typed errors, or user confirmation.

Runnable valid, expired, malformed, and unsupported examples live in
[`examples/`](../examples/README.md).
