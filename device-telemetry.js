async function getDeviceTelemetry() {

    let clientDeviceId = localStorage.getItem("iplay_client_device_id");

    if (!clientDeviceId) {

        clientDeviceId = crypto.randomUUID();

        localStorage.setItem(
            "iplay_client_device_id",
            clientDeviceId
        );

    }

    const ua = navigator.userAgent || "";

    let platform = "web";

    if (/iphone|ipad|ipod/i.test(ua)) {

        platform = "ios";

    } else if (/android/i.test(ua)) {

        platform = "android";

    }


    let osName = navigator.platform || null;
    let osVersion = null;
    let model = null;
    let manufacturer = null;


    if (navigator.userAgentData) {

        try {

            const deviceHints = await navigator.userAgentData.getHighEntropyValues([
                "architecture",
                "bitness",
                "model",
                "platformVersion",
                "uaFullVersion",
                "fullVersionList"
            ]);


            if (deviceHints.platform) {

                osName = deviceHints.platform;

            }


            if (deviceHints.platformVersion) {

                osVersion = deviceHints.platformVersion;

            }


            if (deviceHints.model) {

                model = deviceHints.model;

            }


            if (model) {

                if (/^(SM-|GT-|SCH-|SGH-)/i.test(model)) {

                    manufacturer = "Samsung";

                }

            }

        } catch (deviceError) {

            console.warn("Device information unavailable:", deviceError);

        }

    }


    return {
        clientDeviceId,
        platform,
        osName,
        osVersion,
        manufacturer,
        model,
        appVersion: "v1.0"
    };

}