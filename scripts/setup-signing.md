# Code Signing Setup Guide

This guide explains how to set up code signing for Spec Planner on macOS and Windows.

## macOS Code Signing & Notarization

### Prerequisites

1. **Apple Developer Program membership** ($99/year)
2. **Developer ID Application certificate**
3. **App-specific password** for notarization

### Step 1: Create Certificates

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates)
2. Create a new "Developer ID Application" certificate
3. Download and install the certificate in your Keychain

### Step 2: Export Certificate

1. Open **Keychain Access**
2. Find your "Developer ID Application" certificate
3. Right-click → Export
4. Save as `.p12` file with a strong password

### Step 3: Create App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in → Security → App-Specific Passwords
3. Generate a new password for "Spec Planner Notarization"

### Step 4: Set Environment Variables

For local builds:
```bash
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="your-certificate-password"
export APPLE_ID="your-apple-id@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

For CI/CD (GitHub Actions), add these as repository secrets:
- `CSC_LINK_MAC` (base64 encoded certificate)
- `CSC_KEY_PASSWORD_MAC`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

### Step 5: Encode Certificate for CI

```bash
base64 -i certificate.p12 -o certificate-base64.txt
```

Copy the contents of `certificate-base64.txt` to your `CSC_LINK_MAC` secret.

### Notarization

electron-builder will automatically notarize when the following are set:
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

---

## Windows Code Signing

### Prerequisites

1. **Code signing certificate** from a trusted CA
   - Standard: ~$100-300/year
   - EV (Extended Validation): ~$300-500/year (recommended for SmartScreen)

### Recommended Certificate Providers

- DigiCert
- Sectigo (Comodo)
- GlobalSign
- SSL.com

### Step 1: Purchase Certificate

1. Choose a provider and certificate type
2. Complete identity verification
3. Download certificate as `.pfx` file

### Step 2: Set Environment Variables

For local builds:
```bash
export CSC_LINK="/path/to/certificate.pfx"
export CSC_KEY_PASSWORD="your-certificate-password"
```

For CI/CD (GitHub Actions), add these as repository secrets:
- `CSC_LINK_WIN` (base64 encoded certificate)
- `CSC_KEY_PASSWORD_WIN`

### Step 3: Encode Certificate for CI

```bash
base64 -i certificate.pfx -o certificate-base64.txt
```

### EV Certificate Notes

EV certificates are stored on hardware tokens (USB) and require:
- Physical access to the token during signing
- Token password/PIN entry

For CI/CD with EV certificates:
1. Use a signing service (SignPath, Azure SignTool)
2. Or use a cloud HSM solution

---

## GitHub Actions Setup

Add these secrets to your GitHub repository:

### macOS Secrets
| Secret Name | Description |
|-------------|-------------|
| `CSC_LINK_MAC` | Base64-encoded .p12 certificate |
| `CSC_KEY_PASSWORD_MAC` | Certificate password |
| `APPLE_ID` | Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

### Windows Secrets
| Secret Name | Description |
|-------------|-------------|
| `CSC_LINK_WIN` | Base64-encoded .pfx certificate |
| `CSC_KEY_PASSWORD_WIN` | Certificate password |

### Usage in Workflow

```yaml
- name: Build macOS
  run: npm run package:mac
  env:
    CSC_LINK: ${{ secrets.CSC_LINK_MAC }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD_MAC }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

- name: Build Windows
  run: npm run package:win
  env:
    CSC_LINK: ${{ secrets.CSC_LINK_WIN }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD_WIN }}
```

---

## Troubleshooting

### macOS: "Developer cannot be verified"

This happens when:
1. App is not signed
2. App is not notarized
3. Gatekeeper hasn't cached the notarization

Solution: Ensure notarization completes successfully.

### Windows: SmartScreen Warning

This happens when:
1. App is not signed
2. Certificate is new (no reputation)
3. Using standard (non-EV) certificate

Solutions:
1. Use an EV certificate
2. Submit to Microsoft for analysis
3. Build reputation over time (consistent signing)

### "Code signature invalid"

This happens when:
1. Entitlements are incorrect
2. Hardened runtime issues
3. Bundle contents modified after signing

Solution: Check entitlements.mac.plist and ensure all required entitlements are present.
