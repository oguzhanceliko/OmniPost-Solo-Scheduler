# OmniPost — Sosyal Medya Hesap & API Ekleme Rehberi

Bu rehber, OmniPost platformuna yeni **YouTube**, **Instagram** ve **TikTok** hesapları bağlarken gerekli API anahtarlarını ve token'larını nasıl alacağınızı adım adım açıklar.

---

## 📺 1. YouTube Kanalı Ekleme Rehberi

Google altyapısı zaten kurulduğu için yeni bir YouTube kanalı eklemek **sadece 1 dakika** sürer.

### Adım 1: Yeni Gmail'i Test Kullanıcısı Olarak Ekle
1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin.
2. Sol menüden **"Google Auth Platform"** -> **"Audience"** (Kitle) sekmesine tıklayın.
3. **"+ Add Users"** (Kullanıcı Ekle) butonuna basın.
4. Bağlamak istediğiniz yeni YouTube kanalının bağlı olduğu Gmail adresini yazıp kaydedin.

### Adım 2: Refresh Token Al
1. [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)'ı açın.
2. Sağ üstteki **⚙️ Dişli Çark** simgesine tıklayın:
   - ✅ **"Use your own OAuth credentials"** kutusu işaretli olsun.
   - **OAuth Client ID:** Mevcut Client ID'niz (zaten kayıtlıdır)
   - **OAuth Client secret:** Mevcut Client Secret'ınız (zaten kayıtlıdır)
3. Sol menüden **"YouTube Data API v3"** başlığı altından `https://www.googleapis.com/auth/youtube.upload` seçin.
4. Mavi **"Authorize APIs"** butonuna tıklayın.
5. Açılan pencerede **yeni eklediğiniz YouTube kanalının Gmail'ini seçin** ve izin verin.
6. Playground ekranında **"Exchange authorization code for tokens"** butonuna basın.
7. Sağ alanda oluşan **Refresh token** değerini kopyalayın.

### Adım 3: OmniPost'a Ekle
- OmniPost panelinde **"Hesaplarım" -> "+ Yeni Hesap Ekle"** butonuna basın.
- Platform: **YouTube**
- Kanal Adı: Örn. `@Kanalim`
- Client ID: *Google Cloud'daki Client ID*
- Client Secret: *Google Cloud'daki Client Secret*
- Refresh Token: *Playground'dan aldığınız yeni token*
- **Kaydet** butonuna basın.

---

## 📸 2. Instagram Hesabı Ekleme Rehberi

Meta geliştirici uygulamanız hazır olduğu için yeni hesap bağlamak çok kolaydır.

### Adım 1: Instagram'ı Profesyonel Yap & Facebook Sayfasına Bağla
1. Instagram mobil uygulamasında hesabınıza gidin -> **Ayarlar -> Hesap türü -> Profesyonel hesaba geç** (İçerik Üretici veya İşletme).
2. [Facebook Sayfa Oluşturucu](https://www.facebook.com/pages/create)'ya gidip bir sayfa açın (örn: Kanal Adınız).
3. Instagram uygulamasında **Profili Düzenle -> Sayfa** kısmından bu Facebook sayfasını seçip bağlayın.

### Adım 2: Token ve Hesap ID'sini Al
1. [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)'ı açın.
2. Sağ panelde:
   - **Meta App:** `Omnipost`
   - **User or Page:** `User Token`
3. Mavi **"Generate Access Token"** butonuna tıklayın.
4. Açılan pencerede yeni bağladığınız **Facebook Sayfasını ve Instagram hesabını seçip onaylayın**.
5. Sol üstteki sorgu kutusuna şunu yazıp **Submit** deyin:
   ```text
   me/accounts?fields=name,access_token,instagram_business_account{id,username}
   ```
6. Çıkan JSON yanıtında:
   - `instagram_business_account.id` = **Instagram Account ID**
   - `access_token` = **Instagram Access Token**

### Adım 3: OmniPost'a Ekle
- OmniPost panelinde **"Hesaplarım" -> "+ Yeni Hesap Ekle"** butonuna basın.
- Platform: **Instagram**
- Hesap Adı: Örn. `@hesabim (Instagram)`
- Instagram Account ID: *Yukarıda aldığınız 17 haneli ID*
- Access Token: *Sayfa access token'ı*
- **Kaydet** butonuna basın.

---

## 🎵 3. TikTok Hesabı Ekleme Rehberi

### Adım 1: Otomatik OAuth Bağlantısı
1. OmniPost panelinde **"Hesaplarım" -> "+ Yeni Hesap Ekle"** sekmesinde TikTok'u seçin.
2. **"TikTok ile Yetkilendir"** butonuna tıklayarak doğrudan TikTok oturumu açabilir ve hesabınızı tek tıkla sisteme ekleyebilirsiniz.

*(Not: Geliştirici modunda videolar "Sadece Ben / Gizli" olarak yüklenir. Herkese açık paylaşım için TikTok Developer Portal'dan App Review onayı beklenmelidir.)*
