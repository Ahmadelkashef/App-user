/* =========================================================
   iPLAY Action Tracking — Shared Module
   يعتمد على وجود _supabase معرّف مسبقًا في نفس الصفحة
========================================================= */

const DEVICE_ID_STORAGE_KEY = "iplay_client_device_id";

// خريطة الـactions المعروفة — نضيف فيها أي action جديد بعدين
// الأرقام دي لازم تطابق action_id في جدول action_rules بالظبط
const ACTIONS = {
    LOGIN: 1,             // app_login
    SIGNUP_COMPLETED: 2   // signup_completed
    // نضيف هنا أي action جديد لاحقًا بنفس الطريقة
};

/* ---------------------------------------------------------
   1) client_device_id — يتولد مرة واحدة ويتخزن محليًا
--------------------------------------------------------- */

function getOrCreateClientDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    }

    return id;
}

/* ---------------------------------------------------------
   2) تحديد الـplatform الحالي
--------------------------------------------------------- */

function detectPlatform() {
    const ua = navigator.userAgent || "";

    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    if (/android/i.test(ua)) return "android";
    return "web";
}

/* ---------------------------------------------------------
   3) upsert على user_devices — بيرجع device_id (UUID الصف)
--------------------------------------------------------- */

async function ensureDeviceRegistered(userId) {
    const clientDeviceId = getOrCreateClientDeviceId();
    const platform = detectPlatform();

    try {
        const { data, error } = await _supabase
            .from("user_devices")
            .upsert(
                {
                    user_id: userId,
                    client_device_id: clientDeviceId,
                    platform: platform,
                    os_name: navigator.platform || null,
                    app_version: "v1.0",
                    last_seen_at: new Date().toISOString()
                },
                {
                    onConflict: "user_id,client_device_id"
                }
            )
            .select("device_id")
            .single();

        if (error) {
            console.error("ensureDeviceRegistered error:", error);
            return null;
        }

        return data ? data.device_id : null;

    } catch (err) {
        console.error("ensureDeviceRegistered unexpected error:", err);
        return null;
    }
}

/* ---------------------------------------------------------
   4) الفنكشن الرئيسية — تسجل أي Action ديناميكيًا
   actionKey: أحد مفاتيح ACTIONS (مثلاً "LOGIN")
   options: { referenceId, metadata, actionSource }
--------------------------------------------------------- */

async function logAction(actionKey, options = {}) {
    const actionId = ACTIONS[actionKey];

    if (!actionId) {
        console.error("logAction: unknown actionKey:", actionKey);
        return;
    }

    try {
        const { data: sessionData } = await _supabase.auth.getSession();
        const user = sessionData && sessionData.session
            ? sessionData.session.user
            : null;

        if (!user) {
            console.error("logAction: no authenticated user, skipping");
            return;
        }

        const deviceId = await ensureDeviceRegistered(user.id);

        const { error } = await _supabase
            .from("action_log")
            .insert({
                user_id: user.id,
                action_id: actionId,
                device_id: deviceId,
                action_source: options.actionSource || document.title,
                reference_id: options.referenceId || null,
                platform: detectPlatform(),
                app_version: "v1.0",
                metadata: options.metadata || null
            });

        if (error) {
            console.error("logAction insert error:", error);
        }

    } catch (err) {
        console.error("logAction unexpected error:", err);
    }
}