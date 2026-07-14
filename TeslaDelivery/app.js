"use strict";

const STORAGE_KEY = "teslaDelivery:v1:session";
const THEME_KEY = "teslaDelivery:theme";
const CONTENT_VERSION = 2;
const PHOTO_DB_NAME = "tesla-delivery-v1";
const PHOTO_STORE = "photos";
const MAX_PHOTOS_PER_ITEM = 5;
const VEHICLE_PHOTO_ITEM_ID = "__vehicle-profile__";

const SECTIONS = [
    {
        id: "before",
        title: "Before delivery day",
        shortTitle: "Before delivery",
        intro: "Get the essentials sorted in advance so the handover stays calm and focused.",
        tip: "Allow roughly 20–30 minutes at the car, ideally in daylight. Focus on real damage and faults rather than microscopic differences.",
        items: [
            ["before-tasks", "Complete every outstanding task in the Tesla app."],
            ["before-documents-v2", "Have your driving licence and any required trade-in documents ready."],
            ["before-order", "Have your order configuration and final invoice available for comparison."],
            ["before-insurance", "Arrange insurance from the delivery date."],
            ["before-phone", "Charge your phone, enable Bluetooth and make sure the Tesla app is logged in."],
            ["before-charging", "Know where you will charge first and add a payment method if needed."]
        ]
    },
    {
        id: "photos",
        title: "Photograph the car first",
        shortTitle: "Condition photos",
        intro: "Create a clear record of the car before driving it, especially if it is leased.",
        tip: "For a defect, take both a close-up and a wider photograph that clearly shows where it is on the car.",
        items: [
            ["photos-corners", "Take a photograph from all four corners."],
            ["photos-wheels", "Photograph each wheel."],
            ["photos-odometer", "Photograph the odometer and any warning messages."],
            ["photos-defects", "Record every visible defect with close and wider context photographs."]
        ]
    },
    {
        id: "identity",
        title: "Confirm the correct car",
        shortTitle: "Correct vehicle",
        intro: "Match the physical car and its touchscreen details to your order before getting into condition checks.",
        tip: "Find the VIN under Controls › Software on the touchscreen.",
        items: [
            ["identity-registration", "Registration matches your documents and Tesla app."],
            ["identity-vin", "VIN on the touchscreen matches your order paperwork."],
            ["identity-variant", "Model 3 variant is correct.", "For example Rear-Wheel Drive, Long Range or Performance."],
            ["identity-paint", "Paint colour is correct."],
            ["identity-wheels", "Wheel size and design are correct."],
            ["identity-interior", "Interior colour and trim are correct."],
            ["identity-mileage", "Mileage is reasonably low for a newly delivered car."]
        ]
    },
    {
        id: "exterior",
        title: "Exterior bodywork",
        shortTitle: "Bodywork",
        intro: "Walk around slowly, then repeat the check from a lower angle to catch marks along the lower edges.",
        tip: "Look closely at bumper corners, door sills, wheel arches, the boot loading edge, front boot opening, handles and the underside of the side skirts.",
        items: [
            ["exterior-body-v2", "Body panels and bumpers have no dents, scratches, chips, scuffs or transport damage."],
            ["exterior-paint", "Paint finish is consistent, without obvious polish or buffer marks."],
            ["exterior-lower-v2", "Door edges, sills, wheel arches and visible lower edges are undamaged."],
            ["exterior-glass", "Roof glass, windscreen and windows have no chips, scratches or cracks."],
            ["exterior-trim", "Exterior trim is secure and not lifting."],
            ["exterior-cameras", "Camera lenses and housings are clean, secure and undamaged."],
            ["exterior-plates", "Number plates are straight and securely fitted."]
        ]
    },
    {
        id: "alignment",
        title: "Panel alignment & openings",
        shortTitle: "Panels & openings",
        intro: "Small variations can be normal. Look for anything obviously crooked, rubbing or stopping proper closure.",
        tip: "Close the front boot by pressing down with both hands either side of the badge—never slam it or press in the centre.",
        items: [
            ["alignment-doors-v2", "Every door handle, door and frameless window operates and closes correctly."],
            ["alignment-gaps", "No panel is obviously misaligned, rubbing or interfering with operation."],
            ["alignment-frunk-v2", "Front boot opens, latches and sits flush when closed."],
            ["alignment-boot-v2", "Powered rear boot opens fully, closes cleanly and does not rub."],
            ["alignment-seals", "Rubber seals are properly fitted, not folded, torn or hanging loose."],
            ["alignment-moisture", "No water or unexpected moisture is present in the boot or front boot."]
        ]
    },
    {
        id: "wheels",
        title: "Wheels & tyres",
        shortTitle: "Wheels & tyres",
        intro: "A visibly damaged wheel or tyre should be dealt with before you drive away.",
        tip: "Tyre pressures can take a short drive to appear. There should be no pressure warning once readings are available.",
        items: [
            ["wheels-rims", "No wheel-rim scratches or kerb damage."],
            ["wheels-tyres", "No cuts, bulges or obvious tyre damage."],
            ["wheels-spec-v2", "Tyre sizes and specifications are appropriate for the fitted wheels."],
            ["wheels-covers", "Wheel covers or centre caps are present and secure, where fitted."]
        ]
    },
    {
        id: "lights",
        title: "Lights, mirrors & glass",
        shortTitle: "Lights & glass",
        intro: "Use reflections from a nearby surface or ask someone to help confirm the exterior lights.",
        tip: "Substantial condensation, cracks or a loose light unit should be recorded—not just whether the lamp illuminates.",
        items: [
            ["lights-headlights-v2", "Dipped and main-beam headlights work; lamp units are secure and undamaged."],
            ["lights-signals-v2", "Indicators, hazards, rear lights, brake lights and reversing lights work."],
            ["lights-mirrors", "Mirrors fold, unfold and adjust correctly."],
            ["lights-wipers", "Windscreen wipers and washers operate without catching anything."]
        ]
    },
    {
        id: "interior",
        title: "Interior condition",
        shortTitle: "Interior",
        intro: "Check every seating position and the high-touch surfaces while the cabin is still clean and empty.",
        tip: "Focus on visible condition and safety equipment; small convenience features can be checked later.",
        items: [
            ["interior-seats-v2", "Seat upholstery is clean and free from marks, cuts or damaged stitching."],
            ["interior-seat-fit-v2", "Front seats adjust correctly; rear seats and head restraints are secure."],
            ["interior-belts", "Seatbelts extend, retract and latch correctly."],
            ["interior-trim-v2", "Dashboard, console, door trims, headlining and carpets are clean and undamaged."],
            ["interior-loose", "No loose trim, exposed clips or obviously detached panels."]
        ]
    },
    {
        id: "screens",
        title: "Screens, cameras & controls",
        shortTitle: "Screens & controls",
        intro: "Check the main display, rear display where fitted, driving controls and every available camera view.",
        tip: "Some features calibrate after driving, but persistent camera, restraint, braking, steering or electrical warnings are not normal handover behaviour.",
        items: [
            ["screens-display-v2", "Main and rear displays are undamaged, without obvious dead pixels."],
            ["screens-touch-v2", "Touch response works across the main display and rear display, where fitted."],
            ["screens-warnings", "No persistent warning or fault messages are displayed."],
            ["screens-driver-controls-v2", "Steering-wheel controls, scroll wheels and horn work."],
            ["screens-gears", "Gear selection works normally."],
            ["screens-cameras-v2", "Reversing and side-camera views are clear, with no parking-camera errors."],
            ["screens-steering", "Electric steering-wheel adjustment works."]
        ]
    },
    {
        id: "climate",
        title: "Climate & heated features",
        shortTitle: "Climate & seats",
        intro: "Run heating and cooling long enough to feel a clear temperature difference and listen for abnormal cabin noise.",
        tip: "Heat-pump hums, fan noise and occasional mechanical clunks can be normal as the battery and climate system begin operating.",
        items: [
            ["climate-system-v2", "Heating, cooling, fan speeds and expected vents produce a clear response."],
            ["climate-front-seats-v2", "Driver-seat heating and ventilation work, where fitted."],
            ["climate-wheel", "Heated steering wheel works, where fitted."],
            ["climate-rear-v2", "Rear display, rear climate and rear heated seats work, where fitted."]
        ]
    },
    {
        id: "connectivity",
        title: "Set up phone & keys",
        shortTitle: "Phone & keys",
        intro: "Tesla may release full app access only after delivery is accepted. Complete these checks before relying on the phone key.",
        tip: "Keep one key card in your wallet rather than leaving every backup inside the car.",
        items: [
            ["connectivity-app", "Vehicle appears correctly in your Tesla app."],
            ["connectivity-phone-v2", "Phone key pairs, unlocks the car and permits driving."],
            ["connectivity-cards", "Every supplied key card works."],
            ["connectivity-bluetooth", "Bluetooth connects for calls and audio."],
            ["connectivity-data-v2", "Mobile data, maps and wireless phone charging work."]
        ]
    },
    {
        id: "charging",
        title: "Charging & supplied items",
        shortTitle: "Charging & items",
        intro: "Check the charging hardware, recording drive and every accessory that should be with your order.",
        tip: "A three-pin Tesla Mobile Connector is not included with new UK orders unless it was purchased separately.",
        items: [
            ["charging-port-v2", "Charge-port door opens and closes; the socket is clean and undamaged."],
            ["charging-cable", "Type 2 charging cable is present if included with your vehicle."],
            ["charging-usb", "Dashcam/Sentry USB drive is present in the glovebox and recognised."],
            ["charging-emergency", "Tow eye and any listed emergency items are present."],
            ["charging-accessories-v2", "Included mats and separately ordered accessories are present."]
        ]
    },
    {
        id: "drive",
        title: "First drive checks",
        shortTitle: "First drive",
        intro: "These checks normally happen after handover. Stop safely and report promptly if anything feels wrong.",
        tip: "A single click, parking-brake clunk, low-speed pedestrian sound or battery-conditioning hum can be normal.",
        items: [
            ["drive-steering-v2", "Steering is straight, without noticeable pulling or steering-wheel vibration."],
            ["drive-brakes-v2", "Brakes and regenerative braking respond smoothly."],
            ["drive-noises", "No loud knocks, scraping or persistent rattles are heard."],
            ["drive-acceleration", "Acceleration is smooth."],
            ["drive-systems-v2", "No new warnings appear and reversing/parking cameras continue working."],
            ["drive-pressure", "Tyre-pressure readings appear without a pressure warning."]
        ]
    },
    {
        id: "acceptance",
        type: "guide",
        title: "Before you accept the car",
        shortTitle: "Acceptance decision",
        intro: "Complete the priority checks before confirming delivery where the handover process allows. For home delivery, photograph and report promptly if the driver cannot wait.",
        guideItems: [
            ["Wrong car or configuration", "Do not confirm that the vehicle matches the order if its VIN, variant, colour, wheels or interior are wrong."],
            ["Unsafe tyre, wheel or cracked glass", "Do not drive a vehicle with visibly unsafe damage."],
            ["A door, boot or front boot will not latch", "This needs attention before the vehicle is driven."],
            ["Persistent safety-critical warning", "Brake, steering, restraint, battery or electrical warnings need Tesla’s advice before driving."],
            ["Screen or camera failure prevents safe operation", "A brief setup delay is different from a repeated or persistent failure."],
            ["Significant transport or body damage", "Photograph it and agree a written resolution before accepting if you would not be content with a repair."],
            ["Minor cosmetic point", "Record it promptly, but a small mark or harmless panel-gap variation does not automatically make the car unsafe or justify rejecting it."]
        ]
    },
    {
        id: "reporting",
        type: "guide",
        title: "If you find something later",
        shortTitle: "Reporting issues",
        intro: "Finding something after handover does not mean you have lost the ability to report it. Make a clear record and contact the right party promptly.",
        guideItems: [
            ["Record when you found it", "Note the date, time and mileage, then take a close photograph and a wider location photograph."],
            ["Open a Tesla service request", "In the Tesla app choose Service, select the relevant topic and describe the concern clearly."],
            ["Attach evidence", "Add photographs and include other concerns in the same appointment using Add Another Concern."],
            ["Keep the trail", "Retain the report, screenshots and Tesla messages."],
            ["Treat safety issues differently", "Stop driving if a tyre, glass, brake, steering or critical warning makes the car unsafe; contact Tesla or Roadside Assistance."],
            ["Warranty and consumer rights are separate", "Tesla’s warranty is additional to statutory rights. For a serious unresolved fault, obtain advice appropriate to whether you purchased, financed or leased the car."]
        ]
    }
];

const SECTION_ORDER = [
    "before", "identity", "photos", "exterior", "wheels", "alignment", "lights",
    "interior", "screens", "climate", "charging", "acceptance", "connectivity",
    "drive", "reporting"
];
SECTIONS.sort((left, right) => SECTION_ORDER.indexOf(left.id) - SECTION_ORDER.indexOf(right.id));

const SOURCES = [
    ["Tesla UK delivery-day guidance", "https://www.tesla.com/en_gb/support/delivery-day"],
    ["Tesla UK after taking delivery", "https://www.tesla.com/en_gb/support/after-taking-delivery"],
    ["Tesla UK service appointments", "https://www.tesla.com/en_gb/support/service-visits"],
    ["Tesla UK vehicle warranty", "https://www.tesla.com/en_gb/support/vehicle-warranty"],
    ["Tesla UK Mobile Connector guidance", "https://www.tesla.com/en_gb/support/charging/mobile-connector"],
    ["Model 3 normal operating sounds", "https://www.tesla.com/ownersmanual/model3/en_gb/GUID-AA58ED67-9C93-4EE6-8B19-9FDABE018787.html"],
    ["UK Consumer Rights Act guidance", "https://www.gov.uk/government/publications/consumer-rights-act-2015/consumer-rights-act-2015"],
    ["Tesla Owners UK delivery checklist (unofficial)", "https://teslaowners.uk/new-car-collection-checklist/"]
];

const ITEM_SECTIONS = SECTIONS.filter((section) => section.items);
const ALL_ITEMS = ITEM_SECTIONS.flatMap((section) => section.items.map((item) => ({
    id: item[0],
    title: item[1],
    detail: item[2] || "",
    sectionId: section.id,
    sectionTitle: section.title
})));
const ITEM_MAP = new Map(ALL_ITEMS.map((item) => [item.id, item]));
const PHOTO_TASK_SECTION_ID = "photos";

const elements = {
    appView: document.getElementById("app-view"),
    main: document.getElementById("app-main"),
    bottomNav: document.getElementById("bottom-nav"),
    previous: document.getElementById("previous-button"),
    next: document.getElementById("next-button"),
    navPosition: document.getElementById("nav-position"),
    navLabel: document.getElementById("nav-position-label"),
    navCount: document.getElementById("nav-position-count"),
    vehicleDialog: document.getElementById("vehicle-dialog"),
    vehicleForm: document.getElementById("vehicle-form"),
    navigatorDialog: document.getElementById("navigator-dialog"),
    navigatorList: document.getElementById("navigator-list"),
    installDialog: document.getElementById("install-dialog"),
    nativeInstall: document.getElementById("native-install-button"),
    resetDialog: document.getElementById("reset-dialog"),
    offlineBanner: document.getElementById("offline-banner"),
    themeToggle: document.getElementById("theme-toggle"),
    themeColour: document.getElementById("theme-colour"),
    vehiclePhotoRemove: document.getElementById("vehicle-photo-remove"),
    toast: document.getElementById("toast")
};

let session = loadSession();
let deferredInstallPrompt = null;
let photoDbPromise = null;
let toastTimer = null;
const objectUrls = new Set();

applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
initialiseNavigationHistory();
bindStaticEvents();
render();
updateOnlineState();
registerServiceWorker();

if (!session.configured) {
    window.setTimeout(() => openVehicleDialog(true), 250);
}

function newSession() {
    const now = new Date().toISOString();
    return {
        version: 1,
        contentVersion: CONTENT_VERSION,
        configured: false,
        profile: {
            deliveryType: "Collection",
            deliveryDate: "",
            registration: "",
            vin: "",
            variant: "",
            paint: "",
            wheels: "",
            interior: ""
        },
        responses: {},
        currentView: "overview",
        startedAt: now,
        updatedAt: now
    };
}

function loadSession() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!stored || stored.version !== 1) return newSession();
        const clean = newSession();
        return {
            ...clean,
            ...stored,
            profile: { ...clean.profile, ...(stored.profile || {}) },
            responses: stored.responses && typeof stored.responses === "object" ? stored.responses : {}
        };
    } catch (error) {
        return newSession();
    }
}

function saveSession() {
    session.updatedAt = new Date().toISOString();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
        showToast("Progress could not be saved. Check available browser storage.");
    }
}

function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

function applyTheme(theme, persist = true) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    elements.themeColour.content = isDark ? "#111110" : "#f6f5f3";
    elements.themeToggle.setAttribute("aria-label", isDark ? "Use light mode" : "Use dark mode");
    elements.themeToggle.title = isDark ? "Use light mode" : "Use dark mode";
    if (!persist) return;
    try { localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch (error) { /* preference is optional */ }
}

function bindStaticEvents() {
    document.getElementById("home-button").addEventListener("click", () => navigateTo("overview"));
    elements.themeToggle.addEventListener("click", toggleTheme);
    document.getElementById("edit-vehicle-button").addEventListener("click", () => openVehicleDialog(false));
    document.getElementById("navigator-button").addEventListener("click", openNavigator);
    elements.navPosition.addEventListener("click", openNavigator);
    elements.previous.addEventListener("click", goPrevious);
    elements.next.addEventListener("click", goNext);

    document.getElementById("vehicle-close").addEventListener("click", () => closeDialog(elements.vehicleDialog));
    document.getElementById("vehicle-skip").addEventListener("click", () => {
        session.configured = true;
        saveSession();
        closeDialog(elements.vehicleDialog);
        render();
    });
    elements.vehicleForm.addEventListener("submit", saveVehicleProfile);
    document.querySelectorAll(".vehicle-photo-input").forEach((input) => input.addEventListener("change", (event) => {
        replaceVehiclePhoto(Array.from(event.target.files || []));
        event.target.value = "";
    }));
    elements.vehiclePhotoRemove.addEventListener("click", removeVehiclePhoto);

    document.getElementById("navigator-close").addEventListener("click", () => closeDialog(elements.navigatorDialog));
    document.getElementById("install-close").addEventListener("click", () => closeDialog(elements.installDialog));
    document.getElementById("reset-close").addEventListener("click", () => closeDialog(elements.resetDialog));
    document.getElementById("reset-cancel").addEventListener("click", () => closeDialog(elements.resetDialog));
    document.getElementById("reset-confirm").addEventListener("click", resetEverything);
    elements.nativeInstall.addEventListener("click", triggerNativeInstall);

    elements.appView.addEventListener("click", handleAppClick);
    elements.appView.addEventListener("input", handleAppInput);
    elements.appView.addEventListener("change", handleAppChange);

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        elements.nativeInstall.hidden = false;
    });
}

function handleAppClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
        const action = actionButton.dataset.action;
        if (action === "resume") navigateTo(getResumeView());
        if (action === "edit-vehicle") openVehicleDialog(false);
        if (action === "install") openDialog(elements.installDialog);
        if (action === "navigator") openNavigator();
        if (action === "report") navigateTo("report");
        if (action === "print") window.print();
        if (action === "share") shareReport();
        if (action === "reset") openDialog(elements.resetDialog);
        return;
    }

    const statusButton = event.target.closest(".status-button");
    if (statusButton) {
        setItemStatus(statusButton.dataset.itemId, statusButton.dataset.status);
        return;
    }

    const severityButton = event.target.closest(".severity-button");
    if (severityButton) {
        const response = ensureResponse(severityButton.dataset.itemId);
        response.severity = severityButton.dataset.severity;
        response.updatedAt = new Date().toISOString();
        saveSession();
        render();
        return;
    }

    const removeButton = event.target.closest(".photo-remove");
    if (removeButton) removePhoto(removeButton.dataset.photoId, removeButton.dataset.itemId);
}

function handleAppInput(event) {
    if (!event.target.matches(".issue-notes")) return;
    const response = ensureResponse(event.target.dataset.itemId);
    response.notes = event.target.value;
    response.updatedAt = new Date().toISOString();
    saveSession();
}

function handleAppChange(event) {
    if (!event.target.matches(".photo-input")) return;
    addPhotos(event.target.dataset.itemId, Array.from(event.target.files || []));
    event.target.value = "";
}

function openVehicleDialog(isFirstRun) {
    const profile = session.profile;
    for (const [key, value] of Object.entries(profile)) {
        const field = elements.vehicleForm.elements.namedItem(key);
        if (field) field.value = value || "";
    }
    document.getElementById("vehicle-close").hidden = isFirstRun;
    openDialog(elements.vehicleDialog);
    hydrateVehiclePhotoDisplays();
}

function saveVehicleProfile(event) {
    event.preventDefault();
    const data = new FormData(elements.vehicleForm);
    for (const key of Object.keys(session.profile)) {
        session.profile[key] = String(data.get(key) || "").trim();
    }
    session.profile.registration = session.profile.registration.toUpperCase();
    session.profile.vin = session.profile.vin.toUpperCase();
    session.configured = true;
    saveSession();
    closeDialog(elements.vehicleDialog);
    showToast("Vehicle details saved on this device.");
    render();
}

function render() {
    revokeObjectUrls();
    const view = session.currentView || "overview";
    if (view === "overview") {
        renderOverview();
        elements.bottomNav.hidden = true;
    } else if (view === "report") {
        elements.bottomNav.hidden = true;
        renderReport();
    } else {
        const index = parseSectionIndex(view);
        renderSection(index);
        updateBottomNav(index);
    }
    renderNavigatorList();
}

function renderOverview() {
    const stats = getStats();
    const profile = session.profile;
    const resumeLabel = stats.resolved === 0 ? "Start checklist" : stats.outstanding === 0 ? "Review checklist" : "Continue checklist";
    const profileTitle = profile.variant || "Your Model 3";
    const profileSubtitle = [profile.deliveryType, formatDate(profile.deliveryDate)].filter(Boolean).join(" · ") || "Add your delivery details";

    elements.appView.innerHTML = `
        <section class="overview-hero">
            <div class="hero-actions">
                <button class="button button-primary" type="button" data-action="resume">${escapeHtml(resumeLabel)} ${arrowIcon()}</button>
                <button class="button button-secondary" type="button" data-action="navigator">View sections</button>
            </div>
        </section>

        <section class="vehicle-summary" aria-label="Vehicle details">
            <button class="vehicle-profile-photo vehicle-photo-button" type="button" data-action="edit-vehicle" data-vehicle-photo aria-label="Add or replace the car photograph"></button>
            <div class="vehicle-summary-head">
                <div><h2>${escapeHtml(profileTitle)}</h2><p>${escapeHtml(profileSubtitle)}</p></div>
                <button class="text-button" type="button" data-action="edit-vehicle">Edit</button>
            </div>
            <div class="vehicle-data">
                ${vehicleDatum("Registration", profile.registration)}
                ${vehicleDatum("VIN", profile.vin)}
                ${vehicleDatum("Paint", profile.paint)}
                ${vehicleDatum("Wheels", profile.wheels)}
            </div>
        </section>

        <section class="progress-card" aria-label="Checklist progress">
            <div class="progress-card-head">
                <div><p class="eyebrow">Overall progress</p><span>${stats.outstanding} checks outstanding</span></div>
                <strong class="progress-number">${stats.percent}%</strong>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${stats.percent}%"></div></div>
            <div class="stat-grid">
                ${statBox(stats.pass, "Passed")}
                ${statBox(stats.issue, "Issues")}
                ${statBox(stats.na, "N/A")}
                ${statBox(stats.outstanding, "To do")}
            </div>
        </section>

        <section class="section-card">
            <div class="section-card-head">
                <div><p class="eyebrow">Evidence</p><h2>${stats.issue ? `${stats.issue} issue${stats.issue === 1 ? "" : "s"} recorded` : "Build a photo record"}</h2><p>${stats.critical ? `${stats.critical} marked critical. ` : ""}Photos attached while checking the car appear automatically in the final report.</p></div>
                <button class="button button-secondary" type="button" data-action="report">Open report</button>
            </div>
        </section>

        <section class="privacy-card">
            <p><strong>Your details stay here.</strong> Vehicle information, progress, notes and photographs are stored only in this browser. Clearing its website data will remove them.</p>
            <button class="button button-quiet danger-text" type="button" data-action="reset">Reset checklist progress</button>
        </section>
    `;
    hydrateVehiclePhotoDisplays();
}

function renderSection(index) {
    const safeIndex = Math.max(0, Math.min(index, SECTIONS.length - 1));
    const section = SECTIONS[safeIndex];
    session.currentView = `section-${safeIndex}`;
    saveSession();
    elements.bottomNav.hidden = false;

    if (section.type === "guide") {
        renderGuideSection(section, safeIndex);
        return;
    }

    const counts = getSectionCounts(section);
    elements.appView.innerHTML = `
        <header class="section-hero">
            <p class="eyebrow">Section ${safeIndex + 1} of ${SECTIONS.length}</p>
            <h1>${escapeHtml(section.title)}</h1>
            <p class="lead">${escapeHtml(section.intro)}</p>
            <div class="section-meta">
                <span class="meta-chip">${section.items.length} checks</span>
                <span class="meta-chip">${counts.outstanding} outstanding</span>
                ${counts.issue ? `<span class="meta-chip">${counts.issue} issue${counts.issue === 1 ? "" : "s"}</span>` : ""}
            </div>
        </header>
        ${section.tip ? tipCard(section.tip) : ""}
        <div class="checklist">
            ${section.items.map((item, itemIndex) => renderCheckItem(item, itemIndex)).join("")}
        </div>
    `;
    hydrateVisiblePhotos();
}

function renderGuideSection(section, index) {
    const stats = getStats();
    const isAcceptance = section.id === "acceptance";
    const banner = isAcceptance ? `
        <div class="decision-banner ${stats.critical ? "is-critical" : ""}">
            <strong>${stats.critical ? `${stats.critical} critical issue${stats.critical === 1 ? "" : "s"} currently recorded` : "No critical issues currently recorded"}</strong>
            <p>${stats.critical ? "Show these to the delivery representative and get them formally recorded before accepting the car." : "Continue to use your judgement and record anything you want Tesla to acknowledge."}</p>
        </div>` : "";
    const sources = section.id === "reporting" ? `
        <div class="source-list">
            ${SOURCES.map(([label, href]) => `<a class="source-link" href="${href}" target="_blank" rel="noopener"><span>${escapeHtml(label)}</span><span aria-hidden="true">↗</span></a>`).join("")}
        </div>
        <p class="fine-print">This independent checklist is not affiliated with or endorsed by Tesla. Tesla’s own app, documents and representative remain authoritative for your vehicle.</p>` : "";

    elements.appView.innerHTML = `
        <header class="section-hero">
            <p class="eyebrow">Guide ${index + 1} of ${SECTIONS.length}</p>
            <h1>${escapeHtml(section.title)}</h1>
            <p class="lead">${escapeHtml(section.intro)}</p>
        </header>
        ${banner}
        <ol class="guide-list ${isAcceptance ? "stop-list" : ""}">
            ${section.guideItems.map(([title, detail], itemIndex) => `
                <li class="guide-item"><span class="guide-number">${itemIndex + 1}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></div></li>
            `).join("")}
        </ol>
        ${sources}
        ${section.id === "reporting" ? `<div class="report-actions"><button class="button button-primary" type="button" data-action="report">Prepare delivery report ${arrowIcon()}</button></div>` : ""}
    `;
}

function renderCheckItem(item, itemIndex) {
    const [id, title, detail] = item;
    const response = session.responses[id] || {};
    const status = response.status || "";
    const issuePanel = status === "issue" ? renderIssuePanel(id, response) : "";
    const evidencePanel = isPhotoEnabled(id, status) ? renderEvidencePanel(id, status) : "";
    return `
        <article class="check-item" data-status="${status}" id="item-${id}">
            <div class="item-copy">
                <div class="item-index">Check ${itemIndex + 1}</div>
                <h3>${escapeHtml(title)}</h3>
                ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
            </div>
            <div class="status-control" role="group" aria-label="Status for ${escapeHtml(title)}">
                ${statusButton(id, "pass", "Pass", status)}
                ${statusButton(id, "issue", "Issue", status)}
                ${statusButton(id, "na", "N/A", status)}
            </div>
            ${issuePanel}
            ${evidencePanel}
        </article>
    `;
}

function renderIssuePanel(itemId, response) {
    const severity = response.severity || "attention";
    return `
        <div class="issue-panel">
            <span class="issue-label">How serious is it?</span>
            <div class="severity-control" role="group" aria-label="Issue severity">
                ${severityButton(itemId, "critical", "Critical", severity)}
                ${severityButton(itemId, "attention", "Needs attention", severity)}
                ${severityButton(itemId, "minor", "Minor", severity)}
            </div>
            <label class="issue-label" for="notes-${itemId}">What did you find?</label>
            <textarea class="issue-notes" id="notes-${itemId}" data-item-id="${itemId}" placeholder="Describe the fault, damage and exact location…">${escapeHtml(response.notes || "")}</textarea>
        </div>
    `;
}

function renderEvidencePanel(itemId, status) {
    const item = ITEM_MAP.get(itemId);
    const isPhotoTask = item?.sectionId === PHOTO_TASK_SECTION_ID;
    const isIssue = status === "issue";
    return `
        <div class="evidence-panel">
            <div class="evidence-head">
                <div>
                    <span class="evidence-kicker">${isPhotoTask ? "Photo task" : "Issue evidence"}</span>
                    <p>${isPhotoTask ? "Take this photograph here. Adding it will mark the check as passed." : isIssue ? "Add close and wider photographs so the issue is clear in your report." : "Photograph anything you want included in the report."}</p>
                </div>
                <label class="photo-add photo-camera">${cameraIcon()}<span>Take photo</span><input class="photo-input" data-item-id="${itemId}" type="file" accept="image/*" capture="environment" aria-label="Take photo for ${escapeHtml(item?.title || "this check")}"></label>
            </div>
            <div class="photo-row" data-photo-row data-item-id="${itemId}"></div>
            <div class="evidence-footer">
                <span class="photo-count" data-photo-count="${itemId}">0 of ${MAX_PHOTOS_PER_ITEM}</span>
                <span>Saved only on this device</span>
            </div>
        </div>
    `;
}

async function renderReport() {
    session.currentView = "report";
    saveSession();
    elements.appView.innerHTML = `<section class="section-hero"><p class="eyebrow">Preparing report</p><h1>Gathering your evidence…</h1><p class="lead">Loading photographs saved on this device.</p></section>`;

    const stats = getStats();
    const checkedItems = ALL_ITEMS.filter((item) => ["pass", "issue"].includes(session.responses[item.id]?.status));
    const checkedIds = new Set(checkedItems.map((item) => item.id));
    const allPhotos = await getAllPhotos().catch(() => []);
    const reportPhotos = allPhotos.filter((photo) => photo.itemId === VEHICLE_PHOTO_ITEM_ID || checkedIds.has(photo.itemId));
    const photosByItem = new Map();
    reportPhotos.forEach((photo) => {
        if (!photosByItem.has(photo.itemId)) photosByItem.set(photo.itemId, []);
        photosByItem.get(photo.itemId).push(photo);
    });
    const vehiclePhoto = (photosByItem.get(VEHICLE_PHOTO_ITEM_ID) || [])[0];
    const profile = session.profile;
    const reportTitle = profile.registration ? `Delivery report · ${profile.registration.toUpperCase()}` : "Delivery report";

    elements.appView.innerHTML = `
        <article class="report-document">
            <header class="report-header">
                <p class="eyebrow">Independent UK Model 3 checklist</p>
                <h1>${escapeHtml(reportTitle)}</h1>
                <p class="lead">Prepared ${escapeHtml(formatDateTime(new Date().toISOString()))}. Information and photographs remain stored on this device.</p>
            </header>
            <section class="vehicle-summary">
                ${vehiclePhoto ? `<div class="vehicle-profile-photo report-vehicle-photo"><img src="${makeObjectUrl(vehiclePhoto.blob)}" alt="Vehicle profile photograph"></div>` : ""}
                <div class="vehicle-summary-head"><div><h2>${escapeHtml(profile.variant || "Tesla Model 3")}</h2><p>${escapeHtml([profile.deliveryType, formatDate(profile.deliveryDate)].filter(Boolean).join(" · ") || "Delivery details not entered")}</p></div></div>
                <div class="vehicle-data">
                    ${vehicleDatum("Registration", profile.registration)}
                    ${vehicleDatum("VIN", profile.vin)}
                    ${vehicleDatum("Paint", profile.paint)}
                    ${vehicleDatum("Wheels", profile.wheels)}
                    ${vehicleDatum("Interior", profile.interior)}
                </div>
            </section>
            <div class="report-summary">
                <div class="report-stat"><strong>${stats.issue}</strong><span>Issues</span></div>
                <div class="report-stat"><strong>${stats.critical}</strong><span>Critical</span></div>
                <div class="report-stat"><strong>${stats.pass}</strong><span>Passed</span></div>
                <div class="report-stat"><strong>${reportPhotos.length}</strong><span>Photos</span></div>
            </div>
            <div class="report-actions no-print">
                <button class="button button-primary" type="button" data-action="print">Print / Save PDF</button>
                <button class="button button-secondary" type="button" data-action="share">Share summary</button>
                <button class="button button-secondary" type="button" data-action="navigator">Back to checklist</button>
            </div>
            <section>
                <p class="eyebrow">Completed checks</p>
                ${checkedItems.length ? `<div class="report-issues" id="report-checks"></div>` : `<div class="report-empty"><strong>No completed checks recorded</strong><p>Only items marked Pass or Issue appear in this report.</p></div>`}
            </section>
            <p class="fine-print">This report is a personal handover record produced by an independent checklist. It is not a Tesla service record and does not replace reporting issues in the Tesla app.</p>
        </article>
    `;

    const checkedHtml = checkedItems.map((item) => {
        const response = session.responses[item.id];
        const isIssue = response.status === "issue";
        return `
            <article class="report-issue">
                <div class="report-issue-head"><div><p class="eyebrow">${escapeHtml(item.sectionTitle)}</p><h3>${escapeHtml(item.title)}</h3></div><span class="severity-badge ${isIssue ? "" : "evidence-badge"}">${escapeHtml(isIssue ? severityLabel(response.severity) : "Passed")}</span></div>
                ${isIssue ? `<p>${escapeHtml(response.notes || "No written note added.")}</p>` : ""}
                ${renderReportPhotos(photosByItem.get(item.id) || [], item.title)}
            </article>`;
    });
    const container = document.getElementById("report-checks");
    if (container) container.innerHTML = checkedHtml.join("");
}

function renderReportPhotos(photos, itemTitle) {
    if (!photos.length) return "";
    return `<div class="report-photos">${photos.map((photo) => {
        const url = makeObjectUrl(photo.blob);
        return `<img src="${url}" alt="Evidence photograph for ${escapeHtml(itemTitle)}">`;
    }).join("")}</div>`;
}

function setItemStatus(itemId, status) {
    const response = ensureResponse(itemId);
    response.status = status;
    response.photoAutoCompleted = false;
    if (status === "issue" && !response.severity) response.severity = "attention";
    response.updatedAt = new Date().toISOString();
    saveSession();
    render();
    window.setTimeout(() => document.getElementById(`item-${itemId}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 30);
}

function ensureResponse(itemId) {
    if (!session.responses[itemId]) session.responses[itemId] = { status: "", severity: "attention", notes: "", updatedAt: new Date().toISOString() };
    return session.responses[itemId];
}

function getStats() {
    let pass = 0, issue = 0, na = 0, critical = 0;
    for (const item of ALL_ITEMS) {
        const response = session.responses[item.id];
        if (response?.status === "pass") pass += 1;
        if (response?.status === "issue") {
            issue += 1;
            if (response.severity === "critical") critical += 1;
        }
        if (response?.status === "na") na += 1;
    }
    const total = ALL_ITEMS.length;
    const resolved = pass + issue + na;
    const outstanding = total - resolved;
    const applicable = total - na;
    const percent = applicable === 0 ? 100 : Math.round(((pass + issue) / applicable) * 100);
    return { total, pass, issue, na, critical, resolved, outstanding, percent };
}

function getSectionCounts(section) {
    let pass = 0, issue = 0, na = 0;
    for (const [id] of section.items || []) {
        const status = session.responses[id]?.status;
        if (status === "pass") pass += 1;
        if (status === "issue") issue += 1;
        if (status === "na") na += 1;
    }
    const total = section.items?.length || 0;
    return { total, pass, issue, na, outstanding: total - pass - issue - na };
}

function getResumeView() {
    const current = parseSectionIndex(session.currentView);
    if (current >= 0 && current < SECTIONS.length && getStats().outstanding > 0) return `section-${current}`;
    const firstIncomplete = SECTIONS.findIndex((section) => section.items && getSectionCounts(section).outstanding > 0);
    return firstIncomplete >= 0 ? `section-${firstIncomplete}` : "section-0";
}

function navigateTo(view) {
    const safeView = normaliseView(view);
    if (history.state?.teslaDeliveryView !== safeView) {
        history.pushState({ teslaDeliveryView: safeView }, "", historyUrl(safeView));
    }
    session.currentView = safeView;
    saveSession();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    elements.main.focus({ preventScroll: true });
}

function initialiseNavigationHistory() {
    const restoredView = normaliseView(session.currentView);
    history.replaceState({ teslaDeliveryView: "overview" }, "", historyUrl("overview"));
    if (restoredView !== "overview") {
        history.pushState({ teslaDeliveryView: restoredView }, "", historyUrl(restoredView));
    }
    session.currentView = restoredView;
}

function handleHistoryNavigation(event) {
    const view = event.state?.teslaDeliveryView;
    if (!view) return;
    session.currentView = normaliseView(view);
    saveSession();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    elements.main.focus({ preventScroll: true });
}

function normaliseView(view) {
    if (view === "overview" || view === "report") return view;
    const index = parseSectionIndex(view);
    return index >= 0 && index < SECTIONS.length ? `section-${index}` : "overview";
}

function historyUrl(view) {
    return `${location.pathname}${location.search}#${view}`;
}

function goPrevious() {
    const index = parseSectionIndex(session.currentView);
    if (index <= 0) navigateTo("overview");
    else navigateTo(`section-${index - 1}`);
}

function goNext() {
    const index = parseSectionIndex(session.currentView);
    if (index < SECTIONS.length - 1) navigateTo(`section-${index + 1}`);
    else navigateTo("report");
}

function updateBottomNav(index) {
    const section = SECTIONS[index];
    elements.bottomNav.hidden = false;
    elements.previous.disabled = false;
    elements.navLabel.textContent = section.shortTitle;
    elements.navCount.textContent = `${index + 1} of ${SECTIONS.length}`;
    elements.next.querySelector("span").textContent = index === SECTIONS.length - 1 ? "Report" : "Next";
}

function openNavigator() {
    renderNavigatorList();
    openDialog(elements.navigatorDialog);
}

function renderNavigatorList() {
    elements.navigatorList.innerHTML = SECTIONS.map((section, index) => {
        const counts = section.items ? getSectionCounts(section) : null;
        const statusText = counts ? `${counts.total - counts.outstanding} of ${counts.total} resolved` : "Guide";
        const progress = counts ? `${Math.round(((counts.total - counts.outstanding) / counts.total) * 100)}%` : "→";
        return `<button class="navigator-item" type="button" data-navigate="section-${index}"><span class="navigator-step">${index + 1}</span><span class="navigator-copy"><strong>${escapeHtml(section.shortTitle)}</strong><span>${statusText}</span></span><span class="navigator-progress">${progress}</span></button>`;
    }).join("") + `<button class="navigator-item" type="button" data-navigate="report"><span class="navigator-step">R</span><span class="navigator-copy"><strong>Delivery report</strong><span>Review, print or share</span></span><span class="navigator-progress">→</span></button>`;

    elements.navigatorList.querySelectorAll("[data-navigate]").forEach((button) => {
        button.addEventListener("click", () => {
            closeDialog(elements.navigatorDialog);
            navigateTo(button.dataset.navigate);
        });
    });
}

function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
    if (dialog.open) dialog.close();
}

async function triggerNativeInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (error) { /* no-op */ }
    deferredInstallPrompt = null;
    elements.nativeInstall.hidden = true;
    closeDialog(elements.installDialog);
}

function updateOnlineState() {
    elements.offlineBanner.hidden = navigator.onLine;
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).catch(() => {}));
}

async function resetEverything() {
    const profile = { ...session.profile };
    const configured = session.configured;
    let photosCleared = true;
    try { await clearChecklistPhotos(); } catch (error) { photosCleared = false; }
    session = newSession();
    session.profile = profile;
    session.configured = configured;
    saveSession();
    closeDialog(elements.resetDialog);
    showToast(photosCleared ? "Checklist reset. Car details kept." : "Checklist reset, but some check photographs could not be removed.");
    history.replaceState({ teslaDeliveryView: "overview" }, "", historyUrl("overview"));
    render();
}

async function shareReport() {
    const checkedItems = ALL_ITEMS.filter((item) => ["pass", "issue"].includes(session.responses[item.id]?.status));
    const checkedIds = new Set(checkedItems.map((item) => item.id));
    const allPhotos = await getAllPhotos().catch(() => []);
    const photos = allPhotos.filter((photo) => photo.itemId === VEHICLE_PHOTO_ITEM_ID || checkedIds.has(photo.itemId));
    const issueCount = checkedItems.filter((item) => session.responses[item.id]?.status === "issue").length;
    const profile = session.profile;
    const lines = [
        `Tesla Model 3 delivery report${profile.registration ? ` — ${profile.registration.toUpperCase()}` : ""}`,
        `${checkedItems.length} completed check${checkedItems.length === 1 ? "" : "s"}, ${issueCount} issue${issueCount === 1 ? "" : "s"} and ${photos.length} photo${photos.length === 1 ? "" : "s"} recorded.`,
        ""
    ];
    checkedItems.forEach((item, index) => {
        const response = session.responses[item.id];
        const label = response.status === "issue" ? `ISSUE · ${severityLabel(response.severity)}` : "PASS";
        lines.push(`${index + 1}. [${label}] ${item.sectionTitle}: ${item.title}`);
        if (response.status === "issue" && response.notes) lines.push(`   ${response.notes}`);
    });
    lines.push("", "Photographs and full details are available in the saved checklist report on this device.");
    const text = lines.join("\n");

    if (navigator.share) {
        try {
            await navigator.share({ title: "Tesla delivery report", text });
            return;
        } catch (error) {
            if (error?.name === "AbortError") return;
        }
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast("Report summary copied to the clipboard.");
    } catch (error) {
        showToast("Sharing is unavailable in this browser. Use Print / Save PDF instead.");
    }
}

function openPhotoDb() {
    if (!photoDbPromise) {
        photoDbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(PHOTO_DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(PHOTO_STORE)) {
                    const store = db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
                    store.createIndex("itemId", "itemId", { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return photoDbPromise;
}

async function getPhotos(itemId) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readonly");
        const request = transaction.objectStore(PHOTO_STORE).index("itemId").getAll(itemId);
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        request.onerror = () => reject(request.error);
    });
}

async function getAllPhotos() {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readonly");
        const request = transaction.objectStore(PHOTO_STORE).getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        request.onerror = () => reject(request.error);
    });
}

async function putPhoto(photo) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).put(photo);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}

async function deletePhotoRecord(photoId) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).delete(photoId);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}

async function clearChecklistPhotos() {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readwrite");
        const request = transaction.objectStore(PHOTO_STORE).openCursor();
        request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) return;
            if (cursor.value.itemId !== VEHICLE_PHOTO_ITEM_ID) cursor.delete();
            cursor.continue();
        };
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}

async function replaceVehiclePhoto(files) {
    const file = files.find((candidate) => candidate.type.startsWith("image/"));
    if (!file) {
        if (files.length) showToast("Choose an image of the car.");
        return;
    }
    try {
        const blob = await compressImage(file);
        const existing = await getPhotos(VEHICLE_PHOTO_ITEM_ID);
        const primaryId = existing[0]?.id || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
        await putPhoto({
            id: primaryId,
            itemId: VEHICLE_PHOTO_ITEM_ID,
            name: file.name || "vehicle-photo.jpg",
            blob,
            createdAt: new Date().toISOString()
        });
        for (const extra of existing.slice(1)) await deletePhotoRecord(extra.id);
        await hydrateVehiclePhotoDisplays();
        if (session.currentView === "report") renderReport();
        showToast(existing.length ? "Car photograph replaced." : "Car photograph saved on this device.");
    } catch (error) {
        showToast("The car photograph could not be saved. Check browser storage and try again.");
    }
}

async function removeVehiclePhoto() {
    try {
        const photos = await getPhotos(VEHICLE_PHOTO_ITEM_ID);
        for (const photo of photos) await deletePhotoRecord(photo.id);
        await hydrateVehiclePhotoDisplays();
        if (session.currentView === "report") renderReport();
        showToast("Car photograph removed.");
    } catch (error) {
        showToast("The car photograph could not be removed.");
    }
}

async function hydrateVehiclePhotoDisplays() {
    const [photo] = await getPhotos(VEHICLE_PHOTO_ITEM_ID).catch(() => []);
    const slots = Array.from(document.querySelectorAll("[data-vehicle-photo]"));
    if (!slots.length) return;
    slots.forEach((slot) => {
        const oldUrl = slot.querySelector("img")?.src;
        if (oldUrl && objectUrls.has(oldUrl)) {
            URL.revokeObjectURL(oldUrl);
            objectUrls.delete(oldUrl);
        }
        slot.innerHTML = photo
            ? `<img src="${makeObjectUrl(photo.blob)}" alt="Photograph of your Model 3">`
            : `<div class="vehicle-photo-empty" aria-hidden="true">${carIcon()}<span>Add car photo</span></div>`;
    });
    elements.vehiclePhotoRemove.hidden = !photo;
}

async function addPhotos(itemId, files) {
    if (!files.length) return;
    try {
        const existing = await getPhotos(itemId);
        const allowed = Math.max(0, MAX_PHOTOS_PER_ITEM - existing.length);
        if (!allowed) {
            showToast(`A maximum of ${MAX_PHOTOS_PER_ITEM} photographs can be saved for each check.`);
            return;
        }
        const candidates = files.filter((file) => file.type.startsWith("image/")).slice(0, allowed);
        if (!candidates.length) {
            showToast("Choose a photograph to add to this check.");
            return;
        }
        for (const file of candidates) {
            const blob = await compressImage(file);
            await putPhoto({
                id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                itemId,
                name: file.name || "delivery-photo.jpg",
                blob,
                createdAt: new Date().toISOString()
            });
        }
        const item = ITEM_MAP.get(itemId);
        const response = ensureResponse(itemId);
        const autoCompleted = item?.sectionId === PHOTO_TASK_SECTION_ID && !response.status;
        if (autoCompleted) {
            response.status = "pass";
            response.photoAutoCompleted = true;
            response.updatedAt = new Date().toISOString();
            saveSession();
        }

        if (files.length > allowed) showToast(`Saved ${allowed} photo${allowed === 1 ? "" : "s"}; the limit is ${MAX_PHOTOS_PER_ITEM} per check.`);
        else showToast(`${candidates.length} photo${candidates.length === 1 ? "" : "s"} saved on this device.`);
        if (autoCompleted) render();
        else await hydrateVisiblePhotos();
    } catch (error) {
        showToast("The photograph could not be saved. Check browser storage and try again.");
    }
}

async function removePhoto(photoId, itemId) {
    try {
        await deletePhotoRecord(photoId);
        const remaining = await getPhotos(itemId);
        const response = session.responses[itemId];
        if (!remaining.length && response?.photoAutoCompleted) {
            response.status = "";
            response.photoAutoCompleted = false;
            response.updatedAt = new Date().toISOString();
            saveSession();
            render();
            showToast("Photograph removed and the photo task reopened.");
            return;
        }
        showToast("Photograph removed.");
        await hydrateVisiblePhotos();
    } catch (error) {
        showToast("The photograph could not be removed.");
    }
}

async function hydrateVisiblePhotos() {
    const rows = Array.from(document.querySelectorAll("[data-photo-row]"));
    for (const row of rows) {
        const itemId = row.dataset.itemId;
        const photos = await getPhotos(itemId).catch(() => []);
        row.innerHTML = photos.map((photo) => {
            const url = makeObjectUrl(photo.blob);
            return `<div class="photo-thumb"><img src="${url}" alt="Saved evidence photograph"><button class="photo-remove" type="button" data-photo-id="${photo.id}" data-item-id="${itemId}" aria-label="Remove photograph">×</button></div>`;
        }).join("");
        const count = document.querySelector(`[data-photo-count="${itemId}"]`);
        if (count) count.textContent = `${photos.length} of ${MAX_PHOTOS_PER_ITEM}`;
        const input = document.querySelector(`.photo-input[data-item-id="${itemId}"]`);
        if (input) input.disabled = photos.length >= MAX_PHOTOS_PER_ITEM;
    }
}

async function compressImage(file) {
    const source = await decodeImage(file);
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    if (source.close) source.close();
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")), "image/jpeg", 0.82));
}

async function decodeImage(file) {
    if ("createImageBitmap" in window) return createImageBitmap(file, { imageOrientation: "from-image" });
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image decode failed")); };
        image.src = url;
    });
}

function makeObjectUrl(blob) {
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    return url;
}

function revokeObjectUrls() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls.clear();
}

function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function statusButton(itemId, status, label, current) {
    return `<button class="status-button" type="button" data-item-id="${itemId}" data-status="${status}" aria-pressed="${current === status}">${label}</button>`;
}

function severityButton(itemId, value, label, current) {
    return `<button class="severity-button" type="button" data-item-id="${itemId}" data-severity="${value}" aria-pressed="${current === value}">${label}</button>`;
}

function tipCard(text) {
    return `<aside class="tip-card"><span class="tip-icon">i</span><span>${escapeHtml(text)}</span></aside>`;
}

function vehicleDatum(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "Not added")}</strong></div>`;
}

function carIcon() {
    return `<svg viewBox="0 0 48 24" aria-hidden="true"><path d="M7 16h34l-2.3-6.1a4 4 0 0 0-3.7-2.6H15.2a4 4 0 0 0-3.5 2.1L8.2 16M5 16v3h3m32-3v3h-3M13 16l2-5h19l2 5M12 19a2 2 0 1 0 4 0m17 0a2 2 0 1 0 4 0"/></svg>`;
}

function statBox(value, label) {
    return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function severityLabel(value) {
    if (value === "critical") return "Critical";
    if (value === "minor") return "Minor";
    return "Needs attention";
}

function isPhotoEnabled(itemId, status) {
    const item = ITEM_MAP.get(itemId);
    return item?.sectionId === PHOTO_TASK_SECTION_ID || status === "issue";
}

function parseSectionIndex(view) {
    if (typeof view !== "string" || !view.startsWith("section-")) return -1;
    const index = Number(view.slice(8));
    return Number.isInteger(index) ? index : -1;
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value) {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function arrowIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;
}

function cameraIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4v-11Z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
