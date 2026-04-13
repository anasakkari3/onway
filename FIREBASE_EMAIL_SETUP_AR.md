# إعداد Firebase Trigger Email للإشعارات

هذا المشروع يرسل الإشعارات البريدية بطريقة MVP بسيطة:

1. التطبيق ينشئ إشعارًا داخل `notifications`.
2. إذا كان نوع الإشعار مهمًا وكان المستخدم مفعّل البريد، يضيف التطبيق document داخل collection اسمها `mail`.
3. Firebase Trigger Email extension يراقب `mail` ويرسل الإيميل تلقائيًا.

## ما جهزه الكود

- Collection الافتراضية للبريد: `mail`.
- يمكن تغييرها عبر:

```env
FIREBASE_TRIGGER_EMAIL_COLLECTION=mail
```

- زر/رابط الإيميل يعتمد على:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- الإيميلات ترسل فقط لأنواع الإشعارات المهمة للـ MVP:
  - `booking`
  - `cancellation`
  - `message`

- كل مستخدم لديه تفضيل:

```ts
email_notifications_enabled: true | false
```

إذا لم يكن الحقل موجودًا، يتم اعتباره `true`.

## ما عليك عمله في Firebase

1. افتح Firebase Console:
   `https://console.firebase.google.com`

2. اختر مشروع التطبيق الصحيح.

3. تأكد أن المشروع على Blaze plan:
   - من القائمة الجانبية افتح Project settings.
   - ادخل على Usage and billing.
   - فعّل Blaze plan إذا لم يكن مفعّلًا.

4. افتح صفحة Extensions:
   - من القائمة الجانبية اختر Extensions.
   - اضغط Explore extensions.
   - ابحث عن Trigger Email.
   - اختر Firebase Trigger Email.

5. اضغط Install in Firebase project.

6. أثناء الإعداد اختر:
   - Firestore collection path: `mail`
   - Default FROM address: البريد الذي تريد أن تظهر منه الرسائل.
   - SMTP connection URI أو إعدادات مزود البريد حسب مزودك.

7. جهز مزود البريد:
   - إذا استخدمت SendGrid أو Mailgun أو أي SMTP، أنشئ API key أو SMTP credentials.
   - فعّل sender identity أو verified sender من لوحة مزود البريد.
   - إذا عندك دومين خاص، أضف سجلات DNS المطلوبة من مزود البريد.

8. بعد التثبيت، جرّب بإضافة document يدويًا في Firestore داخل `mail`:

```json
{
  "to": "your-email@example.com",
  "message": {
    "subject": "Batreeqak test",
    "text": "This is a test email from Firebase Trigger Email.",
    "html": "<p>This is a test email from Firebase Trigger Email.</p>"
  }
}
```

إذا وصل الإيميل، يعني الإضافة والمزود جاهزين.

أو استخدم سكربت الاختبار المحلي من المشروع:

```bash
npm run email:test -- your-email@example.com
```

السكربت يقرأ إعدادات Firebase Admin من `.env.local`، ثم يضيف document تجريبيًا داخل collection البريد.

## اختبار التطبيق بعد الإعداد

جرّب هذه السيناريوهات:

1. مستخدم يحجز رحلة.
2. مستخدم يرسل رسالة داخل شات رحلة.
3. سائق أو راكب يلغي حجزًا/رحلة.

في كل حالة تأكد من:

- ظهور إشعار داخل التطبيق.
- إنشاء document داخل `mail`.
- وصول البريد للمستخدم الصحيح.
- الرابط داخل الإيميل يفتح صفحة التطبيق الصحيحة.

## ملاحظات تشغيل مهمة

- لا تضع أسرار SMTP داخل الكود.
- لا تستخدم `localhost` في production داخل `NEXT_PUBLIC_APP_URL`.
- إذا لم تصل الرسائل، افحص Logs الخاصة بالـ extension من Firebase Console.
- إذا أردت لاحقًا batching أو rate limiting أو قواعد إرسال معقدة، انقل منطق البريد إلى Cloud Functions.
