/* =========================================================
   iPLAY Session Processor — Shared Module
   يعتمد على وجود _supabase و getDeviceTelemetry() معرّفين
   مسبقًا في نفس الصفحة (config.js + supabase-js + device-telemetry.js)
========================================================= */

function goToErrorPage(reason) {
    const suffix = reason ? `&reason=${encodeURIComponent(reason)}` : '';
    window.location.href = `index.html?auth_error=1${suffix}`;
}

/* ---------------------------------------------------------
   المعالجة الكاملة لأي Session ناجحة (Google أو Facebook)
   بتتنفذ مرة واحدة بس، بعد التأكد الفعلي من الـOAuth
--------------------------------------------------------- */

async function processAuthSession(session, provider) {
    try {
        const user = session.user;

        if (!user) {
            console.error("No user found in session");
            goToErrorPage('no_user');
            return;
        }

        // Check whether this authenticated user already has an iPLAY account
        // and whether onboarding has already been completed.
        const { data: accountData, error: rpcError } = await _supabase
            .rpc("get_my_account");

        if (rpcError) {
            console.error("get_my_account error:", rpcError);
            goToErrorPage('rpc_error');
            return;
        }

        const account = Array.isArray(accountData)
            ? accountData[0]
            : accountData;

        // Existing iPLAY account
        if (account && account.out_exists) {

            const deviceTelemetry = await getDeviceTelemetry();

            const { data: loginRpcData, error: loginRpcError } = await _supabase
                .rpc("log_app_login", {
                    p_client_device_id: deviceTelemetry.clientDeviceId,
                    p_platform: deviceTelemetry.platform,
                    p_os_name: deviceTelemetry.osName,
                    p_os_version: deviceTelemetry.osVersion,
                    p_manufacturer: deviceTelemetry.manufacturer,
                    p_model: deviceTelemetry.model,
                    p_app_version: deviceTelemetry.appVersion
                });

            if (loginRpcError) {
                console.error("log_app_login RPC error:", loginRpcError);
                goToErrorPage('login_rpc_error');
                return;
            }

            console.log("log_app_login RPC success:", loginRpcData);

            if (provider) {
                const { data: syncData, error: syncError } = await _supabase
                    .rpc("sync_login_credential", { p_provider: provider });

                console.log("sync_login_credential:", provider, syncData, syncError);

                if (syncError) {
                    console.error("sync_login_credential RPC error:", syncError);
                    goToErrorPage('sync_login_credential_error');
                    return;
                }
            }

            // Existing account but onboarding is not completed
            if (!account.out_onboarding_completed_at) {
                window.location.href = "onboarding-checkpoint.html";
                return;
            }

            // Existing account with completed onboarding
            window.location.href = "user_profile.html";
            return;
        }

        // New authenticated user → create the iPLAY account foundation
        const deviceTelemetry = await getDeviceTelemetry();

        const { data: signupRpcData, error: signupRpcError } = await _supabase
            .rpc("complete_auth_signup", {
                p_platform: deviceTelemetry.platform,
                p_app_version: deviceTelemetry.appVersion,
                p_client_device_id: deviceTelemetry.clientDeviceId,
                p_os_name: deviceTelemetry.osName,
                p_os_version: deviceTelemetry.osVersion,
                p_manufacturer: deviceTelemetry.manufacturer,
                p_model: deviceTelemetry.model
            });

        if (signupRpcError) {
            console.error("complete_auth_signup RPC error:", signupRpcError);
            goToErrorPage('signup_rpc_error');
            return;
        }

        console.log("complete_auth_signup RPC success:", signupRpcData);

        // Account created → continue to mandatory onboarding checkpoint
        window.location.href = "onboarding-checkpoint.html";

    } catch (err) {
        console.error("Unexpected session processing error:", err);
        goToErrorPage('unexpected');
    }
}