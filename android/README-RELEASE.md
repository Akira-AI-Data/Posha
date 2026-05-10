# Android Play Store release

## 1. Create a keystore

Run:

```powershell
keytool -genkeypair -v -keystore keystore\posha-release.jks -alias posha -keyalg RSA -keysize 2048 -validity 10000
```

## 2. Create signing config

Copy:

`android/keystore.properties.example` -> `android/keystore.properties`

Then fill in the real values.

## 3. Build Play Store bundle

From `android/` run:

```powershell
.\gradlew.bat bundleRelease
```

Output:

`app/build/outputs/bundle/release/app-release.aab`

## 4. Upload to Play Console

Use the generated `.aab` for internal testing first.
