# AddressZen Address Data Mapping

This document explains how AddressZen returns address data in different formats and how we map it to our internal format.

**Reference:** https://docs.addresszen.com/docs/data

## Supported Data Formats

AddressZen supports multiple country-specific data formats:

- **United States:** USPS Address (standard US postal format)
- **United Kingdom:** PAF Address, Multiple Residence, Not Yet Built, Welsh PAF, PAF Aliases
- **Australia:** G-NAF Address
- **Ireland:** ECAF, ECAD (Eircode addresses)
- **Netherlands:** Kadaster
- **Norway:** Kartverket
- **Global:** HERE Global Address (240+ countries and territories)

**Note:** Our current implementation primarily handles USPS (US) structure. International addresses fall back to generic mapping.

**Reference:** https://docs.addresszen.com/docs/data

## USPS Address Structure

The following sections detail how AddressZen returns USPS address data:

**Reference:** https://docs.addresszen.com/docs/data/usps

## AddressZen USPS Data Structure

When AddressZen validates a US address, it returns data in a USPS-specific structure with the following fields:

### Essential Elements

| AddressZen Field  | Our Field  | Description                             |
| ----------------- | ---------- | --------------------------------------- |
| `line_1`          | `address1` | Primary delivery line (street address)  |
| `line_2`          | `address2` | Secondary delivery line (if applicable) |
| `city`            | `city`     | City name                               |
| `state`           | `state`    | Full state name or abbreviation         |
| `zip_code`        | `zipcode`  | 5-digit ZIP code                        |
| `zip_plus_4_code` | (appended) | 4-digit ZIP+4 extension                 |

### Locality Fields

| AddressZen Field  | Usage                                       |
| ----------------- | ------------------------------------------- |
| `preferred_city`  | Preferred city name (used if available)     |
| `last_line`       | Formatted last line: "City State ZIP-ZIP+4" |
| `zip_plus_4_code` | Combined with `zip_code` to form full ZIP+4 |

### Administrative Fields

| AddressZen Field     | Usage                                                |
| -------------------- | ---------------------------------------------------- |
| `state_abbreviation` | 2-letter state code (preferred over full state name) |
| `usps_country`       | Country name (e.g., "United States")                 |
| `usps_country_iso`   | 3-letter ISO country code (e.g., "USA")              |
| `county`             | County name (informational)                          |

## Mapping Logic

Our mapping logic handles both USPS-structured responses and generic/international responses:

### USPS Address Detection

We detect USPS structure by checking for:

- `line_1` field present
- OR `zip_code` field present

### USPS Address Mapping

When USPS structure is detected:

1. **Address Lines:**

   - `address1` ← `line_1`
   - `address2` ← `line_2` (if present)

2. **City:**

   - Prefer `preferred_city` (if available)
   - Fall back to `city`
   - Fall back to original input

3. **State:**

   - Prefer `state_abbreviation` (2-letter code)
   - Fall back to `state` (full name or abbreviation)
   - Fall back to original input

4. **ZIP Code:**

   - Combine `zip_code` (5 digits) + `zip_plus_4_code` (4 digits)
   - Format: `12345-6789` or just `12345` if no +4

5. **Country:**

   - Prefer `usps_country` (e.g., "United States")
   - Fall back to `country`
   - Default to "United States" if missing

6. **Formatted Address:**

   - Prefer `last_line` (formatted: "City State ZIP-ZIP+4")
   - Otherwise format from components: "City State ZIP"

7. **Validation Status:**
   - `deliverable`: `true` if USPS returns data (implies validation)
   - `standardized`: `true` (USPS response means standardization occurred)

### Generic/International Address Mapping (Fallback)

If USPS structure is not detected, we use generic mapping:

1. **Address Lines:**

   - `address1` ← `line_1` OR `address.line1` OR `address1`
   - `address2` ← `line_2` OR `address.line2` OR `address2`

2. **Location:**

   - `city` ← `city` OR `address.city`
   - `state` ← `state` OR `address.state`
   - `zipcode` ← `zip_code` OR `zipcode` OR `postalCode`
   - `country` ← `country` OR `address.country`

3. **Formatted:**
   - Prefer `formatted` OR `last_line`
   - Otherwise format from components

## Response Structure Examples

### USPS Address Response

```json
{
  "usps": {
    "line_1": "123 MAIN ST",
    "line_2": "APT 4B",
    "city": "PHILADELPHIA",
    "preferred_city": "Philadelphia",
    "state": "Pennsylvania",
    "state_abbreviation": "PA",
    "zip_code": "19147",
    "zip_plus_4_code": "1234",
    "last_line": "Philadelphia PA 19147-1234",
    "usps_country": "United States",
    "usps_country_iso": "USA"
  },
  "deliverable": true,
  "standardized": true
}
```

**Mapped Result:**

```json
{
  "address1": "123 MAIN ST",
  "address2": "APT 4B",
  "city": "Philadelphia",
  "state": "PA",
  "zipcode": "19147-1234",
  "country": "United States",
  "countryCode": "USA",
  "formatted": "Philadelphia PA 19147-1234",
  "deliverable": true,
  "standardized": true
}
```

### Generic/International Response

```json
{
  "line_1": "123 Main Street",
  "city": "London",
  "state": "",
  "zip_code": "SW1A 1AA",
  "country": "United Kingdom",
  "countryCode": "GBR"
}
```

**Mapped Result:**

```json
{
  "address1": "123 Main Street",
  "address2": undefined,
  "city": "London",
  "state": "",
  "zipcode": "SW1A 1AA",
  "country": "United Kingdom",
  "countryCode": "GBR",
  "formatted": "123 Main Street, London, , SW1A 1AA, United Kingdom",
  "deliverable": false,
  "standardized": false
}
```

## Implementation Files

The mapping is implemented in:

1. **Client-side:** `src/utils/addresszen-validator.ts`

   - Method: `mapResponseToValidatedAddress()`
   - Helper: `formatUSPSAddress()`

2. **Server-side (Lambda proxy):** `amplify/functions/addresszen-proxy/handler.ts`
   - Function: `validateAddress()`
   - Helper: `formatUSPSAddress()`

## International Address Formats

For international addresses (non-US), AddressZen may return data in different formats:

- **HERE Global Address:** Standardized format for 240+ countries
- **Country-Specific Formats:** UK PAF, Australian G-NAF, Irish ECAF/ECAD, Dutch Kadaster, Norwegian Kartverket

Our current implementation handles these with the **generic/fallback mapping** logic, which attempts to extract common address fields regardless of the specific data structure.

Future enhancements could include:

- Specific mapping for UK PAF format
- Australian G-NAF format support
- HERE Global Address structure parsing
- Country-specific field mappings

**Reference:** https://docs.addresszen.com/docs/data

## Additional USPS Fields (Available but Not Mapped)

The following USPS fields are available in AddressZen responses but are not currently mapped:

- `building_or_firm_name` - Building or company name
- `primary_number` - House/rural route number
- `secondary_number` - Apartment/suite number
- `street_name` - Street name without suffix
- `street_suffix_abbreviation` - Street suffix (ST, DR, etc.)
- `street_pre_directional_abbreviation` - Pre-directional (N, S, etc.)
- `street_post_directional_abbreviation` - Post-directional
- `county` - County name
- `county_number` - FIPS county code
- `carrier_route_id` - Postal route ID
- `congressional_district_number` - Congressional district
- `base_alternate_code` - Base vs alternate record indicator
- `record_type_code` - Record type (S=Street, P=PO Box, etc.)

These can be mapped in the future if needed for enhanced address display or analytics.

---

**References:**

- Data Formats Overview: https://docs.addresszen.com/docs/data
- USPS Address Format: https://docs.addresszen.com/docs/data/usps
- HERE Global Address: https://docs.addresszen.com/docs/data/here (when available)
