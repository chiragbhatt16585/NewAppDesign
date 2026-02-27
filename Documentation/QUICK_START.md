# Quick Start Guide

## 🚀 **Build Commands**

### **For Microscan (Current Client):**
```bash
npm run build:microscan
npm run dev:microscan
```

### **For DNA Infotel (New Client):**
```bash
npm run build:dna-infotel
npm run dev:dna-infotel
```

## 📋 **What Gets Changed Per Client:**

| Client | Bundle ID | App Name | API URL | Keystore |
|--------|-----------|----------|---------|----------|
| **Microscan** | `in.spacecom.log2space.client.microscan` | "Microscan ISP App" | `https://mydesk.microscan.co.in` | `Log2SpaceEndUserMicroscan.jks` |
| **DNA Infotel** | `com.h8.dnasubscriber` | "DNA Infotel App" | `https://crm.dnainfotel.com` | `Log2spaceDNAInfotelAppKey.jks` |

## 🔧 **Adding New Client:**

1. **Create client folder:**
   ```bash
   mkdir -p config/newclient
   cp config/microscan/* config/newclient/
   ```

2. **Update files:**
   - `config/newclient/app.json` - Bundle ID, app name
   - `config/newclient/api.ts` - API URLs
   - `config/newclient/strings.json` - Company details
   - `config/newclient/assets/` - Client logo

3. **Add keystore file:**
   ```bash
   # Copy your keystore file
   cp your-keystore.jks config/newclient/
   
   # Update keystore-config.gradle with your credentials
   ```

4. **Add build script** to `package.json`:
   ```json
   "build:newclient": "node scripts/build-client.js newclient"
   ```

## 🔐 **Keystore Setup:**

### **Current Keystores:**
- **Microscan**: `Log2SpaceEndUserMicroscan.jks` (password: `log2space`)
- **DNA Infotel**: `Log2spaceDNAInfotelAppKey.jks` (password: `dnasubscriber`)

### **For New Client:**
1. **Place keystore file** in `config/newclient/your-keystore.jks`
2. **Update keystore-config.gradle:**
   ```gradle
   release {
       storeFile file('your-keystore.jks')
       storePassword 'your_password'
       keyAlias 'your_alias'
       keyPassword 'your_password'
   }
   ```

## 🎯 **Next Steps for DNA Infotel:**

1. **Get DNA Infotel logo** and add to `config/dna-infotel/assets/`
2. **Get DNA Infotel API details** and update `config/dna-infotel/api.ts`
3. **Update company information** in `config/dna-infotel/strings.json`
4. **Update keystore password** in `config/dna-infotel/keystore-config.gradle` if needed
5. **Test the build**: `npm run build:dna-infotel`

## ✅ **Benefits:**

- ✅ **Same codebase** for all clients
- ✅ **Different bundle IDs** (separate apps)
- ✅ **Different API endpoints** (client-specific backends)
- ✅ **Different branding** (logos, company names)
- ✅ **Different keystores** (separate app signing)
- ✅ **Easy to add new clients** (5 minutes setup)
- ✅ **No code duplication** (maintain once, use everywhere) 