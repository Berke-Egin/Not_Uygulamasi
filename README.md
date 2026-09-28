# Notika

Türkçe, kişisel not uygulaması. `index.html` dosyasını tarayıcıda açarak kullanabilirsiniz. Derleme veya hesap açma gerekmez. HTML, CSS ve JavaScript kullanır.

- Not oluşturma, düzenleme, silme, sabitleme ve arşivleme.
- Üç önem derecesi, dört kategori ve altı kart rengi.
- Başlık ve içerikte arama; önem ve kategori filtreleri; tarih ve önem sıralaması.
- Tarihli hatırlatıcılar ve tamamlandı işareti.
- Her düzenlemede localStorage kaydı. Filtreler, sıralama, açık düzenleyici ve sayfa konumu yeniden açılışta korunur.
- JSON yedek dışa aktarma ve mevcut notları silmeden içe aktarma.
- Telefon ve masaüstüne uyumlu arayüz. Yeni not için N, arama için / kısayolu.

Veriler kullanılan tarayıcı profiline ve adrese aittir. Aynı dosyayı aynı tarayıcıda açın. Dosyanın konumunu, tarayıcıyı veya sunucu adresini değiştirmeden önce yedek alın. Tarayıcı verilerini temizlemek notları siler; gizli pencere kalıcı kullanım için uygun değildir. Birden fazla sekmede eşzamanlı düzenleme desteklenmez.

Hatırlatıcılar uygulama açıkken 15 saniyede bir kontrol edilir. Uygulama kapalıyken işletim sistemi bildirimi gönderilmez; zamanı geçen hatırlatıcılar sonraki açılışta görünür. Tam kapalı tarayıcıda bildirim için sunucu destekli Web Push veya işletim sistemi entegrasyonu gerekir.

Google Fonts erişilemezse sistem yazı tipi kullanılır. Not işlevleri internet gerektirmez. İsteğe bağlı olarak sabit bir yerel HTTP adresinden sunabilirsiniz: `python -m http.server 8080` ve `http://localhost:8080`.
