# XIPTV Play Android — bağımsız geliştirme devri

**Kaynak referans:** `Txgoood/xiptvplay`, dal: `fix-series-on-build248-20261101`, commit: `c051cf2ca3ea07cdcd81c385b29311f28bf6e257` (Build #271, Android 1.4.6 / versionCode 14).
**Taşıma:** Kaynak daldaki **174 dosyanın tamamı içerik SHA değerleri eşleşecek şekilde** bu deponun ilk kopyasına aktarıldı. WebOS için ayrı dal/proje bu Android kopyasına dahil edilmedi. `server.ts` ve web arayüzü Android/Capacitor için gerekli olduğu için dahildir.

## Derleme ve test zinciri
`.github/workflows/main.yml` içerisinde şu adımlar vardır:
1. Node.js ve Java 21 kurulumu, `npm ci`.
2. `npm run lint` + `node --import tsx --test tests/*.test.ts`.
3. `npm run build`, üretim çıktısını doğrulama ve `npx cap sync android`.
4. Sabit debug keystore doğrulaması (GitHub Actions `ANDROID_DEBUG_KEYSTORE_BASE64` secret).
5. Yerel oynatıcı test videosu hazırlama.
6. Gradle unit test, debug APK ve instrumentation APK derlemesi.
7. APK dosya bütünlüğü, sertifika ve paket adı doğrulaması.
8. Android emülatörü açılarak `scripts/android-emulator-smoke.sh` ve `scripts/android-player-controls-smoke.sh`; ekran görüntüsü/log artifact yükleme.

**Önemli:** Repository secrets ve geçmiş GitHub Actions run kayıtları Git ile taşınmaz. Yeni deponun Settings → Secrets and variables → Actions bölümüne, orijinal depoda kullanılan **aynı** `ANDROID_DEBUG_KEYSTORE_BASE64` gizli değişkeninin ayrıca tanımlanması gerekir. Gizli imza dosyasını kaynak koda commit etmeyin; yeni anahtar üretirseniz mevcut telefona güncelleme olarak kurulamaz. `main` dalına push veya Actions → Build Android APK → Run workflow ile CI başlatılabilir.

## Android kapsamı
React/Vite UI, Capacitor Android, native Java servisleri, ses/video, indirme ve bildirimler, profil sistemi, favoriler, katalog, Xtream/M3U, TMDB, senkronizasyon, `server.ts` yardımcı backend, ikonlar, Gradle wrapper ve bütün mevcut test betikleri.

## Özellikle geriye dönük test edilecekler
- Build #248 arayüzü ve davranışının korunması.
- Dizi kataloglarında TR/MULTI, özellikle VisionQuest ve Altered Carbon sezon-bölüm listesi; sağlayıcıdan bağımsız doğrulama henüz yapılmadı.
- İndirme devam/iptal/sezon sırası, indirileni açma, MD5 onayı ve bildirim.
- Farklı profiller, ebeveyn kısıtları, yedekleme ve katalog yenileme.
- Oynatıcı (altyazı, ses, seek, kaldığı yerden sürdürme, TS/MKV).

**Kaynak depo koruma politikası:** `Txgoood/xiptvplay` üzerinde değişiklik yapılmamalıdır; burada geliştirilecek değişiklikler yalnızca `Txgoood/Xiptvplaynew` içine yazılmalıdır.

## Geçmiş derlemeler
Kaynak GitHub Actions #248 ve #271, ilgili APK artifactleri ve CI logları kaynak depoda kalır. GitHub geçmiş Actions kayıtları yeni depoya yeniden adlandırılarak taşınamaz. Yeni deponun Actions geçmişi burada ilk kez çalıştırıldığında oluşur.
