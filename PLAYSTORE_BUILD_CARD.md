# 🚀 Play Store Build Quick Reference

## 📱 Build Commands

### All Clients at Once
```bash
./scripts/build-playstore-release.sh
```

### Single Client
```bash
./scripts/build-playstore-release.sh dnainfotel
./scripts/build-playstore-release.sh microscan
./scripts/build-playstore-release.sh onesevenstar
```

### Manual Commands
```bash
# DNA Infotel
cd android && ./gradlew bundleDnainfotelRelease

# Microscan
cd android && ./gradlew bundleMicroscanRelease

# One Sevenstar
cd android && ./gradlew bundleOnesevenstarRelease
```

## 📦 Output Files

**AAB Files (Play Store):**
```
android/app/build/outputs/bundle/dnainfotelRelease/app-dnainfotel-release.aab
android/app/build/outputs/bundle/microscanRelease/app-microscan-release.aab
android/app/build/outputs/bundle/onesevenstarRelease/app-onesevenstar-release.aab
```

**APK Files (Alternative):**
```
android/app/build/outputs/apk/dnainfotel/release/app-dnainfotel-release.apk
android/app/build/outputs/apk/microscan/release/app-microscan-release.apk
android/app/build/outputs/apk/onesevenstar/release/app-onesevenstar-release.apk
```

## 🔐 Keystore Files

| Client | Keystore File | Password |
|--------|---------------|----------|
| DNA Infotel | `Log2spaceDNAInfotelAppKey.jks` | `log2space` |
| Microscan | `Log2SpaceEndUserMicroscan.jks` | `log2space` |
| One Sevenstar | `OneSevenStar.jks` | `log2space` |

## 📋 Version Information

| Client | Version Code | Version Name |
|--------|--------------|--------------|
| DNA Infotel | 291 | 291.0.0 |
| Microscan | 33 | 33.0.0 |
| One Sevenstar | 4 | 4.0.0 |

## 🎯 Upload Process

1. **Build Release**
   ```bash
   ./scripts/build-playstore-release.sh
   ```

2. **Locate AAB Files**
   ```bash
   ls -la android/app/build/outputs/bundle/*/app-*-release.aab
   ```

3. **Upload to Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app
   - Production → Create new release
   - Upload `.aab` file
   - Add release notes
   - Review and roll out

## 🔧 Troubleshooting

### Check Keystores
```bash
ls -la android/app/*.jks
```

### Verify Signing
```bash
cd android && ./gradlew signingReport
```

### Clean Build
```bash
cd android && ./gradlew clean
./scripts/build-playstore-release.sh
```

### Check File Sizes
```bash
du -h android/app/build/outputs/bundle/*/app-*-release.aab
```

## ⚡ Quick Commands

```bash
# Build all for Play Store
./scripts/build-playstore-release.sh

# Build specific client
./scripts/build-playstore-release.sh dnainfotel

# Check what's built
ls -la android/app/build/outputs/bundle/*/

# Clean and rebuild
cd android && ./gradlew clean && cd ..
./scripts/build-playstore-release.sh
```

## 📊 Best Practices

- ✅ **Always use AAB format** (smaller, optimized)
- ✅ **Test on multiple devices** before release
- ✅ **Increment version codes** for each release
- ✅ **Use descriptive release notes**
- ✅ **Test internal testing** before production
- ✅ **Keep keystore files secure**

---

**🎉 Ready for Play Store deployment!** 