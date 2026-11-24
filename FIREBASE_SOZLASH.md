# Google bilan kirish va umumiy reytingni yoqish (≈10 daqiqa)

1. https://console.firebase.google.com → **Add project** (nom: orbita). Analytics shart emas.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** (support email tanlang → Save).
3. **Authentication → Settings → Authorized domains** ga `orbita.uz` va `www.orbita.uz` ni qo'shing
   (hosting domenini ham, masalan `xxx.netlify.app`).
4. **Build → Firestore Database → Create database** (production mode, region: eur3 yoki europe-west).
5. Firestore → **Rules** bo'limiga shu papkadagi `firestore.rules` ichidagi matnni to'liq qo'yib **Publish** qiling.
6. **Project settings (⚙) → Your apps → Web (</>)** → ilovani ro'yxatdan o'tkazing → chiqqan `firebaseConfig`
   qiymatlarini `firebase-config.js` fayliga (apiKey, authDomain, projectId, appId) yozing.
7. Butun papkani hostingga (Netlify / Cloudflare Pages / Vercel) joylang va domenni ulang.

Natija: "Google bilan kirish" tugmasi paydo bo'ladi, profil bulutda saqlanadi (boshqa qurilmada ham tiklanadi),
Google bilan kirganlar hamma uchun umumiy reytingda ko'rinadi.
