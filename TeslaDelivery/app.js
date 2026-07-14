"use strict";

const STORAGE_KEY = "teslaDelivery:v1:session";
const CONTENT_VERSION = 1;
const PHOTO_DB_NAME = "tesla-delivery-v1";
const PHOTO_STORE = "photos";
const MAX_PHOTOS_PER_ISSUE = 5;

const SECTIONS = [
    {
        id: "before",
        title: "Before delivery day",
        shortTitle: "Before delivery",
        intro: "Get the essentials sorted in advance so the handover stays calm and focused.",
        tip: "Allow roughly 20–30 minutes at the car, ideally in daylight. Focus on real damage and faults rather than microscopic differences.",
        items: [
            ["before-tasks", "Complete every outstanding task in the Tesla app."],
            ["before-order", "Check the registration, VIN, colour, wheels, interior and variant match your order."],
            ["before-insurance", "Arrange insurance from the delivery date."],
            ["before-phone", "Charge your phone and make sure the Tesla app is logged in."],
            ["before-kit", "Bring a small torch and a clean microfibre cloth."],
            ["before-charging", "Confirm home charging is ready or know where you will charge first."],
            ["before-time", "Leave enough time so you are not rushed."]
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
            ["photos-sides", "Photograph the front, rear and both sides."],
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
            ["identity-software", "Any paid software options appear against the vehicle."],
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
            ["exterior-damage", "No scratches, chips, dents, scuffs or polish marks."],
            ["exterior-transport", "No transport damage around bumpers and lower edges."],
            ["exterior-paint", "Paint colour and finish are consistent between panels."],
            ["exterior-edges", "Door edges and sills are undamaged."],
            ["exterior-openings", "Paint around the boot and front boot openings is undamaged."],
            ["exterior-glass", "Roof glass, windscreen and windows have no chips, scratches or cracks."],
            ["exterior-trim", "Exterior trim is secure and not lifting."],
            ["exterior-cameras", "Cameras are clean, correctly fitted and undamaged."],
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
            ["alignment-doors", "All four doors open and close without excessive force."],
            ["alignment-windows", "Windows lower slightly as a door opens and rise again when it closes."],
            ["alignment-handles", "All door handles operate correctly."],
            ["alignment-gaps", "Panel gaps look reasonably consistent from left to right."],
            ["alignment-frunk-open", "Front boot opens and latches properly."],
            ["alignment-frunk-flush", "Front boot sits flush when closed."],
            ["alignment-boot", "Powered rear boot opens fully and closes cleanly."],
            ["alignment-boot-rub", "Rear boot does not rub against adjacent panels."],
            ["alignment-chargeport", "Charge-port door opens and closes electronically."],
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
            ["wheels-spec", "All four tyres have the expected matching make and specification."],
            ["wheels-valves", "Valve caps are present."],
            ["wheels-covers", "Wheel covers are secure, if fitted."],
            ["wheels-inflation", "Tyres do not appear visibly underinflated."],
            ["wheels-pressure", "Tyre pressures appear without warnings after a short drive.", "Mark N/A until you have driven if readings are not yet available."]
        ]
    },
    {
        id: "lights",
        title: "Lights, mirrors & glass",
        shortTitle: "Lights & glass",
        intro: "Use reflections from a nearby surface or ask someone to help confirm the exterior lights.",
        tip: "Substantial condensation, cracks or a loose light unit should be recorded—not just whether the lamp illuminates.",
        items: [
            ["lights-headlights", "Dipped and main-beam headlights work."],
            ["lights-indicators", "Indicators and hazard lights work."],
            ["lights-brakes", "Brake lights work."],
            ["lights-rear", "Rear lights and reversing lights work."],
            ["lights-interior", "Interior, boot and front-boot lights work."],
            ["lights-units", "Light units are securely fitted."],
            ["lights-condensation", "No cracks or substantial condensation inside light units."],
            ["lights-mirrors", "Mirrors fold, unfold and adjust correctly."],
            ["lights-wipers", "Windscreen wipers and washers operate without catching anything."]
        ]
    },
    {
        id: "interior",
        title: "Interior condition",
        shortTitle: "Interior",
        intro: "Check every seating position and the high-touch surfaces while the cabin is still clean and empty.",
        tip: "Use N/A for an item your order does not include, such as optional floor mats.",
        items: [
            ["interior-seats", "Seats are clean and free from marks, cuts or damaged stitching."],
            ["interior-front-seats", "Driver and passenger seats move through their full range."],
            ["interior-rear", "Rear seats and head restraints are correctly fitted."],
            ["interior-belts", "Seatbelts extend, retract and latch correctly."],
            ["interior-trim", "Dashboard, centre console and door trims are unmarked."],
            ["interior-headlining", "Headlining is clean and securely fitted."],
            ["interior-carpets", "Carpets are dry and properly installed."],
            ["interior-mats", "Floor mats are present if included in your order."],
            ["interior-storage", "Cupholders, storage compartments and armrests open correctly."],
            ["interior-glovebox", "Glovebox opens from the touchscreen."],
            ["interior-loose", "No loose trim, rattling panels or exposed clips."]
        ]
    },
    {
        id: "screens",
        title: "Screens, cameras & controls",
        shortTitle: "Screens & controls",
        intro: "Check the main display, rear display where fitted, driving controls and every available camera view.",
        tip: "Some features calibrate after driving, but persistent camera, restraint, braking, steering or electrical warnings are not normal handover behaviour.",
        items: [
            ["screens-main", "Main touchscreen has no cracks, scratches or dead pixels."],
            ["screens-touch", "Touch response works across the entire main display."],
            ["screens-rear", "Rear touchscreen works correctly, where fitted."],
            ["screens-warnings", "No persistent warning or fault messages are displayed."],
            ["screens-wheel", "Steering-wheel controls and scroll wheels work."],
            ["screens-horn", "Horn works."],
            ["screens-gears", "Gear selection works normally."],
            ["screens-reverse", "Reversing camera displays a clear picture."],
            ["screens-side", "Side-camera views appear when indicating."],
            ["screens-park", "Parking visualisation starts without camera errors."],
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
            ["climate-cold", "Air conditioning produces noticeably cold air."],
            ["climate-warm", "Heating produces warm air."],
            ["climate-vents", "Air flows from all expected vents."],
            ["climate-fan", "Fan works at low and high speeds without abnormal noise."],
            ["climate-front-heat", "Heated front seats work."],
            ["climate-front-vent", "Ventilated front seats work, where fitted."],
            ["climate-rear-heat", "Heated rear seats work, where fitted."],
            ["climate-wheel", "Heated steering wheel works, where fitted."],
            ["climate-rear-control", "Rear passengers can control climate from the rear display, where fitted."],
            ["climate-smell", "No strong damp, chemical or burning smells."]
        ]
    },
    {
        id: "connectivity",
        title: "Phone, keys & connectivity",
        shortTitle: "Phone & keys",
        intro: "Confirm you can unlock, start and connect to the car before relying on your phone key.",
        tip: "Keep one key card in your wallet rather than leaving every backup inside the car.",
        items: [
            ["connectivity-app", "Vehicle appears correctly in your Tesla app."],
            ["connectivity-phone-key", "Phone key is paired."],
            ["connectivity-unlock", "Phone unlocks the car."],
            ["connectivity-drive", "Car permits driving using the phone key."],
            ["connectivity-cards", "Every supplied key card works."],
            ["connectivity-bluetooth", "Bluetooth connects for calls and audio."],
            ["connectivity-data", "Mobile data and maps load."],
            ["connectivity-voice", "Voice commands respond."],
            ["connectivity-wireless", "Both wireless phone-charging positions work."],
            ["connectivity-usb", "USB-C ports work where practical to test."]
        ]
    },
    {
        id: "charging",
        title: "Charging & supplied items",
        shortTitle: "Charging & items",
        intro: "Check the charging hardware, recording drive and every accessory that should be with your order.",
        tip: "A three-pin Tesla Mobile Connector is not included with new UK orders unless it was purchased separately.",
        items: [
            ["charging-door", "Charge-port door opens from the touchscreen and app."],
            ["charging-socket", "Charging socket is undamaged."],
            ["charging-cable", "Type 2 charging cable is present if included with your vehicle."],
            ["charging-usb", "Dashcam/Sentry USB drive is present in the glovebox and recognised."],
            ["charging-emergency", "Tow eye and any other listed emergency items are present."],
            ["charging-accessories", "Any separately ordered accessories are included."]
        ]
    },
    {
        id: "drive",
        title: "Brief test drive",
        shortTitle: "Test drive",
        intro: "Before leaving the immediate area, check the car at low and normal road speeds where safe.",
        tip: "A single click, parking-brake clunk, low-speed pedestrian sound or battery-conditioning hum can be normal.",
        items: [
            ["drive-steering", "Steering is straight and the car does not pull noticeably to one side."],
            ["drive-vibration", "No steering-wheel vibration."],
            ["drive-brakes", "Brakes operate smoothly."],
            ["drive-regen", "Regenerative braking behaves normally."],
            ["drive-noises", "No loud knocks, scraping or persistent rattles."],
            ["drive-acceleration", "Acceleration is smooth."],
            ["drive-indicators", "Indicators and automatic cancellation behave correctly."],
            ["drive-cameras", "Reversing and parking cameras continue working."],
            ["drive-warnings", "No new warning messages appear."],
            ["drive-pressure", "Tyre-pressure readings appear after driving."]
        ]
    },
    {
        id: "acceptance",
        type: "guide",
        title: "Before you accept the car",
        shortTitle: "Acceptance decision",
        intro: "Ask Tesla to resolve or formally record a serious issue before you take the vehicle.",
        guideItems: [
            ["Significant dents, scratches or paint damage", "Minor marks can still be recorded without necessarily refusing the whole car."],
            ["Cracked glass", "Include roof glass, windscreen and windows."],
            ["A damaged tyre or wheel", "Do not drive away on visibly unsafe damage."],
            ["A door, boot or front boot that will not latch", "This is an operational and safety concern."],
            ["A badly misaligned panel that rubs or interferes", "Different-looking gaps alone are less important than interference."],
            ["A dead or repeatedly freezing touchscreen", "Record repeated failures, not just a single slow moment during setup."],
            ["Serious steering, brake, restraint, battery or electrical warnings", "Persistent critical warnings need attention before driving."],
            ["Cameras that do not work and prevent safe manoeuvring", "Especially reversing and parking views."],
            ["The wrong colour, trim, wheels or vehicle variant", "Confirm the delivered configuration against the order."]
        ]
    },
    {
        id: "reporting",
        type: "guide",
        title: "Report anything you find",
        shortTitle: "Reporting issues",
        intro: "Create a clear handover trail before leaving wherever possible.",
        guideItems: [
            ["Show the defect", "Point it out to the delivery representative before leaving, where possible."],
            ["Get it recorded", "Ask for the issue to be recorded against the vehicle."],
            ["Keep clear evidence", "Take close and wider photographs that show the defect and its location."],
            ["Open a Tesla service request", "In the Tesla app, select Service and describe each issue."],
            ["Attach the photographs", "Add the relevant images to the service request."],
            ["Keep screenshots", "Save screenshots of the submitted request and any response."],
            ["Report promptly", "Owner-club guidance suggests reporting before leaving or within the first 100 miles; this is not an official Tesla deadline."]
        ]
    }
];

const SOURCES = [
    ["Tesla UK delivery-day guidance", "https://www.tesla.com/en_gb/support/delivery-day"],
    ["Tesla UK vehicle warranty", "https://www.tesla.com/en_gb/support/vehicle-warranty"],
    ["Tesla UK Mobile Connector guidance", "https://www.tesla.com/en_gb/support/charging/mobile-connector"],
    ["Model 3 normal operating sounds", "https://www.tesla.com/ownersmanual/model3/en_gb/GUID-AA58ED67-9C93-4EE6-8B19-9FDABE018787.html"],
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
    toast: document.getElementById("toast")
};

let session = loadSession();
let deferredInstallPrompt = null;
let photoDbPromise = null;
let toastTimer = null;
const objectUrls = new Set();

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

function bindStaticEvents() {
    document.getElementById("home-button").addEventListener("click", () => navigateTo("overview"));
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
            <p class="eyebrow">UK Model 3 · Delivery day</p>
            <h1>A calm, clear handover.</h1>
            <p class="lead">Work through the car in about 20–30 minutes. Record meaningful damage or faults, keep evidence together and avoid getting lost in tiny cosmetic differences.</p>
            <div class="hero-actions">
                <button class="button button-primary" type="button" data-action="resume">${escapeHtml(resumeLabel)} ${arrowIcon()}</button>
                <button class="button button-secondary" type="button" data-action="navigator">View sections</button>
            </div>
        </section>

        <section class="vehicle-summary" aria-label="Vehicle details">
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
                <div><p class="eyebrow">Evidence</p><h2>${stats.issue ? `${stats.issue} issue${stats.issue === 1 ? "" : "s"} recorded` : "No issues recorded"}</h2><p>${stats.critical ? `${stats.critical} marked critical. ` : ""}Prepare a photo report whenever you need it.</p></div>
                <button class="button button-secondary" type="button" data-action="report">Open report</button>
            </div>
        </section>

        <section class="install-card">
            <div><p class="eyebrow">No signal? No problem.</p><h2>Keep it available offline</h2><p>Add the checklist to your Home Screen or simply revisit it once before delivery day.</p></div>
            <button class="button button-secondary" type="button" data-action="install">How to install</button>
        </section>

        <section class="privacy-card">
            <p><strong>Your details stay here.</strong> Vehicle information, progress, notes and photographs are stored only in this browser. Clearing its website data will remove them.</p>
            <button class="button button-quiet danger-text" type="button" data-action="reset">Reset all checklist data</button>
        </section>
    `;
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
        ${section.id === "reporting" ? `<div class="report-actions"><button class="button button-primary" type="button" data-action="report">Prepare issue report ${arrowIcon()}</button></div>` : ""}
    `;
}

function renderCheckItem(item, itemIndex) {
    const [id, title, detail] = item;
    const response = session.responses[id] || {};
    const status = response.status || "";
    const issuePanel = status === "issue" ? renderIssuePanel(id, response) : "";
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
            <div class="photo-row" data-photo-row data-item-id="${itemId}"></div>
            <div class="photo-actions">
                <label class="photo-add">＋ Add photo<input class="photo-input" data-item-id="${itemId}" type="file" accept="image/*" capture="environment" multiple></label>
                <span class="photo-count" data-photo-count="${itemId}">0 of ${MAX_PHOTOS_PER_ISSUE}</span>
            </div>
        </div>
    `;
}

async function renderReport() {
    session.currentView = "report";
    saveSession();
    const stats = getStats();
    const issues = ALL_ITEMS.filter((item) => session.responses[item.id]?.status === "issue");
    const profile = session.profile;
    const reportTitle = profile.registration ? `Delivery report · ${profile.registration.toUpperCase()}` : "Delivery issue report";

    elements.appView.innerHTML = `
        <article class="report-document">
            <header class="report-header">
                <p class="eyebrow">Independent UK Model 3 checklist</p>
                <h1>${escapeHtml(reportTitle)}</h1>
                <p class="lead">Prepared ${escapeHtml(formatDateTime(new Date().toISOString()))}. Information and photographs remain stored on this device.</p>
            </header>
            <section class="vehicle-summary">
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
            </div>
            <div class="report-actions no-print">
                <button class="button button-primary" type="button" data-action="print">Print / Save PDF</button>
                <button class="button button-secondary" type="button" data-action="share">Share summary</button>
                <button class="button button-secondary" type="button" data-action="navigator">Back to checklist</button>
            </div>
            <section>
                <p class="eyebrow">Recorded findings</p>
                ${issues.length ? `<div class="report-issues" id="report-issues"><p class="fine-print">Loading photographs…</p></div>` : `<div class="report-empty"><strong>No issues recorded</strong><p>Your checklist currently contains no items marked Issue.</p></div>`}
            </section>
            <p class="fine-print">This report is a personal handover record produced by an independent checklist. It is not a Tesla service record and does not replace reporting issues in the Tesla app.</p>
        </article>
    `;

    if (!issues.length) return;
    const issueHtml = await Promise.all(issues.map(async (item) => {
        const response = session.responses[item.id];
        const photos = await getPhotos(item.id).catch(() => []);
        const photoHtml = photos.length ? `<div class="report-photos">${photos.map((photo) => {
            const url = makeObjectUrl(photo.blob);
            return `<img src="${url}" alt="Evidence photograph for ${escapeHtml(item.title)}">`;
        }).join("")}</div>` : "";
        return `
            <article class="report-issue">
                <div class="report-issue-head"><div><p class="eyebrow">${escapeHtml(item.sectionTitle)}</p><h3>${escapeHtml(item.title)}</h3></div><span class="severity-badge">${escapeHtml(severityLabel(response.severity))}</span></div>
                <p>${escapeHtml(response.notes || "No written note added.")}</p>
                ${photoHtml}
            </article>`;
    }));
    const container = document.getElementById("report-issues");
    if (container) container.innerHTML = issueHtml.join("");
}

function setItemStatus(itemId, status) {
    const response = ensureResponse(itemId);
    response.status = status;
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
    session.currentView = view;
    saveSession();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    elements.main.focus({ preventScroll: true });
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
    }).join("") + `<button class="navigator-item" type="button" data-navigate="report"><span class="navigator-step">R</span><span class="navigator-copy"><strong>Issue report</strong><span>Review, print or share</span></span><span class="navigator-progress">→</span></button>`;

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
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {}));
}

async function resetEverything() {
    localStorage.removeItem(STORAGE_KEY);
    try { await clearPhotos(); } catch (error) { /* storage may already be empty */ }
    session = newSession();
    closeDialog(elements.resetDialog);
    showToast("Checklist reset.");
    render();
    window.setTimeout(() => openVehicleDialog(true), 200);
}

async function shareReport() {
    const issues = ALL_ITEMS.filter((item) => session.responses[item.id]?.status === "issue");
    const profile = session.profile;
    const lines = [
        `Tesla Model 3 delivery report${profile.registration ? ` — ${profile.registration.toUpperCase()}` : ""}`,
        `${issues.length} issue${issues.length === 1 ? "" : "s"} recorded.`,
        ""
    ];
    issues.forEach((item, index) => {
        const response = session.responses[item.id];
        lines.push(`${index + 1}. [${severityLabel(response.severity)}] ${item.title}`);
        if (response.notes) lines.push(`   ${response.notes}`);
    });
    lines.push("", "Photographs and full details are available in the saved checklist report on this device.");
    const text = lines.join("\n");

    if (navigator.share) {
        try {
            await navigator.share({ title: "Tesla delivery issue report", text });
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

async function clearPhotos() {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).clear();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}

async function addPhotos(itemId, files) {
    if (!files.length) return;
    try {
        const existing = await getPhotos(itemId);
        const allowed = Math.max(0, MAX_PHOTOS_PER_ISSUE - existing.length);
        if (!allowed) {
            showToast(`A maximum of ${MAX_PHOTOS_PER_ISSUE} photographs can be saved for each issue.`);
            return;
        }
        const candidates = files.filter((file) => file.type.startsWith("image/")).slice(0, allowed);
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
        if (files.length > allowed) showToast(`Saved ${allowed} photo${allowed === 1 ? "" : "s"}; the limit is ${MAX_PHOTOS_PER_ISSUE} per issue.`);
        else showToast(`${candidates.length} photo${candidates.length === 1 ? "" : "s"} saved on this device.`);
        await hydrateVisiblePhotos();
    } catch (error) {
        showToast("The photograph could not be saved. Check browser storage and try again.");
    }
}

async function removePhoto(photoId, itemId) {
    try {
        await deletePhotoRecord(photoId);
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
        if (count) count.textContent = `${photos.length} of ${MAX_PHOTOS_PER_ISSUE}`;
        const input = document.querySelector(`.photo-input[data-item-id="${itemId}"]`);
        if (input) input.disabled = photos.length >= MAX_PHOTOS_PER_ISSUE;
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

function statBox(value, label) {
    return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function severityLabel(value) {
    if (value === "critical") return "Critical";
    if (value === "minor") return "Minor";
    return "Needs attention";
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

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
