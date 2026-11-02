# XIPTV Play

IPTV (Xtream Codes / M3U) Oynatıcısı.

## Kurulum ve Çalıştırma

### 1) PC (Web Geliştirme)
Bilgisayarda Node.js kurulu iken:
```bash
npm install
npm run dev
```
Tarayıcıda [http://localhost:3000](http://localhost:3000) adresinden erişebilirsiniz. (Proxy kullanıcının kendi IP'siyle çıkar.)

### 2) APK (Android)
```bash
npm install
npx cap add android
npm run cap:sync
```
*   `android/app/src/main/AndroidManifest.xml` içerisindeki `<application>` etiketine `android:usesCleartextTraffic="true"` ekleyin.
*   `npx cap open android` ile Android Studio'da açıp Build > Build APK seçeneği ile kurulum dosyasını oluşturun.

## Android indirme notları
- İndirme süresi artık tek bir anlık hız ölçümüne göre değil, yumuşatılmış hız ortalamasına göre hesaplanır; kaynak sunucu toplam boyutu bildirmiyorsa ETA kesin olmayabilir.
- Tamamlanan indirme kartındaki **Dosyayı Aç / Paylaş** düğmesi Android paylaşım penceresini açar. Android'in uygulama özelindeki `Directory.Data` klasörü dosya yöneticisinde doğrudan açılabilir bir genel klasör değildir; bu nedenle paylaşım penceresinden VLC gibi bir oynatıcı seçilebilir.
- MKV kapsayıcısı veya içindeki kodekler Android WebView tarafından desteklenmeyebilir. Böyle dosyalar için harici oynatıcı kullanın.
- `@capacitor/share` eklentisi eklendi. Bağımlılıkları yükledikten sonra `npx cap sync android` çalıştırıp APK'yi yeniden oluşturun.
- Bir indirme akışının hızını yalnızca arayüzden artırmak mümkün değildir; hız sunucu, ağ ve yayın sağlayıcısının sınırlarına bağlıdır. Bu sürüm sahte bir “hızlandır” kontrolü göstermez.


## ✅ Doğrulanmış Android APK (tam kaynak kopyası)

Bu deponun kaynak referansı: **XIPTV Play Android 1.4.6 (versionCode 14), Build #271**.
GitHub Actions **Build #271 başarılı**, Android emülatör iş akışı da başarıyla tamamlandı.

- [Build #271 — doğrulanmış Android APK (app-debug.zip)](https://github.com/Txgoood/xiptvplay/actions/runs/41348182904/artifacts/13100520641)
- [Build #271 — Android oynatıcı instrumentation test APK](https://github.com/Txgoood/xiptvplay/actions/runs/41348182904/artifacts/13100247359)
- [Build #271 — emülatör test raporu](https://github.com/Txgoood/xiptvplay/actions/runs/41348182904/artifacts/13100033596)

**Önemli:** Bu bağlantılar eski kaynak deponun Actions artifact dosyalarına açılır.
Kaynak kod, Java/Android dosyaları, logolar, otomatik testler ve CI iş akışı bu yeni depoya aynen taşınmıştır.
GitHub Actions geçmişi, artifactler ve **gizli imzalama anahtarı** depolar arasında otomatik taşınmaz.
İmzalama anahtarını yeni depoya kopyalamadan burada uyumlu bir güncelleme APK'sı üretilmez.

### Yeni depoda aynı kimlikle APK oluşturmak

1. Yeni depo → **Settings → Secrets and variables → Actions**.
2. **New repository secret** → ad: `ANDROID_DEBUG_KEYSTORE_BASE64`; değer: eski depodaki **aynı** keystore dosyasının Base64 içeriği.
3. **Actions → Build Android APK → Run workflow → main**.
4. Yeşil iş akışından `app-debug` artifactini indir, ZIP'i aç ve APK'yı kur.

GitHub güvenlik nedeniyle eski secret'ın değerini göstermez ve depolar arasında paylaşmaz.
Eski imza anahtarı elde değilse yeni APK farklı sertifikayla imzalanır; telefondaki kurulu sürüme *üzerine güncelleme* olarak yüklenemez.
Mevcut uygulamayı veya kullanıcı verilerini silmeden önce yedekleme yapılmalıdır.

### Derleme ve testler
`npm ci`, `npm run lint`, `node --import tsx --test tests/*.test.ts`, `npm run build`, `npx cap sync android`;
Gradle unit/instrumentation derlemeleri; APK imza/doğrulama kontrolleri ve iki Android emülatör smoke test betiği
`.github/workflows/main.yml` içinde saklanmıştır.

