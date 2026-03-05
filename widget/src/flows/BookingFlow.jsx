import { useState, useMemo } from "react";
import airports from "../static/airports.json";
import { SERVICES } from "../../../shared/constants.js";


// Mock data

const CABIN_CLASSES = [
    { id: "economy", label: "Economy", icon: "", desc: "Best value" },
    { id: "premium_economy", label: "Premium Economy", icon: "", desc: "Extra comfort" },
    { id: "business", label: "Business", icon: "", desc: "Lie-flat seats" },
    { id: "first", label: "First Class", icon: "", desc: "Ultimate luxury" },
];

const TRIP_TYPES = [
    { id: "one_way", label: "One Way", icon: "→" },
    { id: "round_trip", label: "Round Trip", icon: "⇄" },
];

const STEPS = ["service", "tripType", "origin", "destination", "dates", "passengers", "cabin", "done"];

const stepIndex = (step) => STEPS.indexOf(step);

// ── Reusable AirportSearch ──────────────────────────────────────────────────
function AirportSearch({ label, value, onSelect, excludeCode }) {
    const [search, setSearch] = useState(
        value ? (() => {
            const a = airports.find(a => a.airportCode === value);
            return a ? `${a.cityName} - ${a.airportName} (${a.airportCode})` : "";
        })() : ""
    );
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return airports
            .filter(a => a.airportCode !== excludeCode)
            .filter(a =>
                !q ||
                a.airportName.toLowerCase().includes(q) ||
                a.airportCode.toLowerCase().includes(q) ||
                a.cityName.toLowerCase().includes(q) ||
                a.countryName.toLowerCase().includes(q)
            )
            .slice(0, 20);
    }, [search, excludeCode]);

    const select = (airport) => {
        onSelect(airport);
        setSearch(`${airport.cityName} - ${airport.airportName} (${airport.airportCode})`);
        setOpen(false);
    };

    return (
        <div style={{ position: "relative" }}>
            <p style={styles.label}>{label}</p>
            <input
                type="text"
                placeholder="Search city or airport..."
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                style={styles.input}
            />
            {open && (
                <div style={styles.dropdown}>
                    {filtered.map(a => (
                        <div key={a.airportCode} onMouseDown={() => select(a)} style={styles.dropdownItem}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ fontSize: 14 }}>{a.cityName}</strong>
                                <span style={styles.code}>{a.airportCode}</span>
                            </div>
                            <div style={styles.sub}>{a.airportName} · {a.countryName}</div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div style={{ padding: "12px", color: "#999", fontSize: 13 }}>No airport found</div>}
                </div>
            )}
        </div>
    );
}

// ── Counter ─────────────────────────────────────────────────────────────────
function Counter({ label, sublabel, value, min, max, onChange }) {
    return (
        <div style={styles.counter}>
            <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{label}</div>
                {sublabel && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{sublabel}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                    style={{ ...styles.counterBtn, opacity: value <= min ? 0.3 : 1 }}
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                >−</button>
                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: "center" }}>{value}</span>
                <button
                    style={{ ...styles.counterBtn, opacity: value >= max ? 0.3 : 1 }}
                    onClick={() => onChange(Math.min(max, value + 1))}
                    disabled={value >= max}
                >+</button>
            </div>
        </div>
    );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function Progress({ step }) {
    const idx = stepIndex(step);
    const total = STEPS.length - 1; // exclude "done"
    const pct = Math.min(100, Math.round((idx / (total - 1)) * 100));
    return (
        <div style={{ padding: "0 16px 12px" }}>
            <div style={{ height: 3, background: "#f0f0f0", borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#ff5100", borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BookingFlow({ onAction, onClose }) {
    const [step, setStep] = useState("service");
    const [data, setData] = useState({
        service: "",
        tripType: "",
        origin: "",
        destination: "",
        departDate: "",
        returnDate: "",
        adults: 1,
        children: 0,
        infants: 0,
        cabin: "",
        email: "",
        phone: "",
        name: ""
    });

    const set = (key, val) => setData(d => ({ ...d, [key]: val }));

    const back = () => {
        const idx = stepIndex(step);
        if (idx > 0) setStep(STEPS[idx - 1]);
        else onClose?.();
    };

    const next = () => {
        const idx = stepIndex(step);
        setStep(STEPS[idx + 1]);
    };

    const handleConfirm = () => {
        setStep("done");
    };

    const summary = () => {
        const parts = [];
        if (data.origin && data.destination) parts.push(`${data.origin} → ${data.destination}`);
        if (data.departDate) parts.push(data.departDate);
        const pax = [
            data.adults > 0 && `${data.adults}A`,
            data.children > 0 && `${data.children}C`,
            data.infants > 0 && `${data.infants}I`,
        ].filter(Boolean).join(" · ");
        if (pax) parts.push(pax);
        if (data.cabin) parts.push(CABIN_CLASSES.find(c => c.id === data.cabin)?.label || "");
        return parts.join("  ·  ");
    };


    const handleSearch = () => {
        onAction?.("flight", data);
        onClose?.();
    };


    const handleSubmitQuery = () => {  
        onAction?.("query", data);
        onClose?.();
     }


    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={back}>
                    {step === "service" ? "✕" : "← Back"}
                </button>
                <span style={styles.headerTitle}>
                    {"New Booking"}
                </span>
                <div style={{ width: 56 }} />
            </div>

            {step !== "service" && step !== "done" && <Progress step={step} />}

            {/* ── Service ── */}
            {step === "service" && (
                <div style={styles.body}>
                    <p style={styles.question}>What would you like to book?</p>
                    <div style={styles.serviceGrid}>
                        {SERVICES.map(s => {
                            const isDisabled = s !== "Flight";
                            return (
                                <button
                                    key={s}
                                    style={{
                                        ...styles.serviceCard,
                                        opacity: isDisabled ? 0.5 : 1,
                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                        background: isDisabled ? "#f7f7f7" : styles.serviceCard.background,
                                        border: isDisabled ? "1.5px dashed #ddd" : styles.serviceCard.border,
                                        position: "relative",
                                    }}
                                    onClick={() => { set("service", s); next(); }}
                                    disabled={s === "Flight" ? false : true}
                                    title={isDisabled ? "Coming Soon" : ""}
                                    onMouseEnter={e => {
                                        if (isDisabled) {
                                            let tip = e.currentTarget.querySelector(".cs-tip");
                                            if (tip) tip.style.display = "block";
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        let tip = e.currentTarget.querySelector(".cs-tip");
                                        if (tip) tip.style.display = "none";
                                    }}
                                >
                                    {isDisabled && (
                                        <span style={{
                                            position: "absolute", top: 6, right: 8,
                                            fontSize: 11, color: "#bbb",
                                        }}>🔒</span>
                                    )}

                                    <span style={{
                                        ...styles.serviceLabel,
                                        color: isDisabled ? "#bbb" : styles.serviceLabel?.color,
                                    }}>{s}</span>

                                    {isDisabled && (
                                        <div className="cs-tip" style={{
                                            display: "none",
                                            position: "absolute",
                                            bottom: "calc(100% + 6px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: "#1a1a1a",
                                            color: "#fff",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: 8,
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none",
                                            zIndex: 10,
                                        }}>
                                            Coming Soon
                                            <div style={{
                                                position: "absolute",
                                                top: "100%", left: "50%",
                                                transform: "translateX(-50%)",
                                                borderWidth: "4px 4px 0",
                                                borderStyle: "solid",
                                                borderColor: "#1a1a1a transparent transparent",
                                            }} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Trip Type ── */}
            {step === "tripType" && (
                <div style={styles.body}>
                    <p style={styles.question}>Select trip type</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {TRIP_TYPES.map(t => (
                            <button
                                key={t.id}
                                style={{ ...styles.selectCard, ...(data.tripType === t.id ? styles.selectCardActive : {}) }}
                                onClick={() => { set("tripType", t.id); next(); }}
                            >
                                <span style={{ fontSize: 22 }}>{t.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 16 }}>{t.label}</span>
                                {data.tripType === t.id && <span style={styles.check}>✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Origin ── */}
            {step === "origin" && (
                <div style={styles.body}>
                    <p style={styles.question}>Where are you flying from?</p>
                    <AirportSearch
                        label="Origin airport"
                        value={data.origin}
                        onSelect={a => set("origin", a.airportCode)}
                        excludeCode={data.destination}
                    />
                    <button
                        style={{ ...styles.nextBtn, ...(data.origin ? {} : styles.nextBtnDisabled) }}
                        onClick={next}
                        disabled={!data.origin}
                    >Next →</button>
                </div>
            )}

            {/* ── Destination ── */}
            {step === "destination" && (
                <div style={styles.body}>
                    <p style={styles.question}>Where are you flying to?</p>
                    <AirportSearch
                        label="Destination airport"
                        value={data.destination}
                        onSelect={a => set("destination", a.airportCode)}
                        excludeCode={data.origin}
                    />
                    <button
                        style={{ ...styles.nextBtn, ...(data.destination ? {} : styles.nextBtnDisabled) }}
                        onClick={next}
                        disabled={!data.destination}
                    >Next →</button>
                </div>
            )}

            {/* ── Dates ── */}
            {step === "dates" && (
                <div style={styles.body}>
                    <p style={styles.question}>When are you travelling?</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                            <p style={styles.label}>Departure date</p>
                            <input
                                type="date"
                                value={data.departDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={e => set("departDate", e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        {data.tripType === "round_trip" && (
                            <div>
                                <p style={styles.label}>Return date</p>
                                <input
                                    type="date"
                                    value={data.returnDate}
                                    min={data.departDate || new Date().toISOString().split("T")[0]}
                                    onChange={e => set("returnDate", e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                        )}
                    </div>
                    <button
                        style={{ ...styles.nextBtn, ...(data.departDate ? {} : styles.nextBtnDisabled) }}
                        onClick={next}
                        disabled={!data.departDate}
                    >Next →</button>
                </div>
            )}

            {/* ── Passengers ── */}
            {step === "passengers" && (
                <div style={styles.body}>
                    <p style={styles.question}>Who's travelling?</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
                        <Counter label="Adults" sublabel="Age 12+" value={data.adults} min={1} max={9} onChange={v => set("adults", v)} />
                        <div style={styles.divider} />
                        <Counter label="Children" sublabel="Age 2–11" value={data.children} min={0} max={9} onChange={v => set("children", v)} />
                        <div style={styles.divider} />
                        <Counter label="Infants" sublabel="Under 2 (lap)" value={data.infants} min={0} max={data.adults} onChange={v => set("infants", v)} />
                    </div>
                    <button style={styles.nextBtn} onClick={next}>Next →</button>
                </div>
            )}

            {/* ── Cabin ── */}
            {step === "cabin" && (
                <div style={styles.body}>
                    <p style={styles.question}>Select cabin class</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {CABIN_CLASSES.map(c => (
                            <button
                                key={c.id}
                                style={{ ...styles.cabinCard, ...(data.cabin === c.id ? styles.cabinCardActive : {}) }}
                                onClick={() => set("cabin", c.id)}
                            >
                                <span style={{ fontSize: 22 }}>{c.icon}</span>
                                <div style={{ textAlign: "left", flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                                    <div style={{ fontSize: 12, color: data.cabin === c.id ? "#ff5100" : "#999" }}>{c.desc}</div>
                                </div>
                                {data.cabin === c.id && <span style={styles.check}>✓</span>}
                            </button>
                        ))}
                    </div>
                    <button
                        style={{ ...styles.nextBtn, marginTop: 16, ...(data.cabin ? {} : styles.nextBtnDisabled), padding: "12px 14px" }}
                        onClick={handleConfirm}
                        disabled={!data.cabin}
                    >Next</button>
                </div>
            )}

            {/* ── Done ── */}
            {step === "done" && (data?.adults + data?.children + data?.infants > 0) && (data?.adults + data?.children + data?.infants < 9) && (
                <div style={{ ...styles.body, alignItems: "center", textAlign: "center", justifyContent: "center" }}>
                    {/* <div style={styles.successIcon}>✈️</div> */}
                    <h2 style={{ fontWeight: 800, fontSize: 22, margin: "16px 0 8px", color: "#1a1a1a" }}>Confirm Details</h2>
                    <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>{summary()}</p>
                    <div style={styles.summaryCard}>
                        {[
                            ["Service", data.service],
                            ["Trip Type", TRIP_TYPES.find(t => t.id === data.tripType)?.label],
                            ["From", data.origin],
                            ["To", data.destination],
                            ["Depart", data.departDate],
                            data.tripType === "round_trip" && ["Return", data.returnDate],
                            ["Passengers", `${data.adults} Adult${data.adults > 1 ? "s" : ""}${data.children ? `, ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants ? `, ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`],
                            ["Cabin", CABIN_CLASSES.find(c => c.id === data.cabin)?.label],
                        ].filter(Boolean).map(([k, v]) => v && (
                            <div key={k} style={styles.summaryRow}>
                                <span style={{ color: "#888", fontSize: 12 }}>{k}</span>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <button style={{ ...styles.nextBtn, padding: "12px 14px", width: "100%" }} onClick={handleSearch}>Search Flight</button>
                </div>
            )}
            {/* More than 9 passengers. Get Information in form. */}

            {step === "done" && (data?.adults + data?.children + data?.infants >= 9) && (
                <div style={{ ...styles.body, alignItems: "center", textAlign: "center", justifyContent: "center" }}>
                    <h2 style={{ fontWeight: 800, fontSize: 22, margin: "16px 0 8px", color: "#1a1a1a" }}>Contact Us for Group Bookings</h2>
                    <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>For bookings with 9 or more passengers, please contact our support team for assistance.</p>
                    <form>
                        <input type="text" placeholder="Your Name" value={data.name} style={{ ...styles.input, marginBottom: 12 }} onChange={(e) => setData({ ...data, name: e.target.value })} required />
                        <input type="email" placeholder="Your Email" value={data.email} style={{ ...styles.input, marginBottom: 12 }} onChange={(e) => setData({ ...data, email: e.target.value })} required />
                        <input type="tel" placeholder="Your Phone Number" value={data.phone} style={{ ...styles.input, marginBottom: 12 }} onChange={(e) => setData({ ...data, phone: e.target.value })} required />
                    </form>
                    <button style={{ ...styles.nextBtn, padding: "12px 14px", width: "100%" }} onClick={handleSubmitQuery}>
                        Submit Inquiry
                    </button>
                </div>
            )}

        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
    shell: {
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: "#fff",
        borderRadius: 20,
        width: 360,
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 16px 12px",
        borderBottom: "1px solid #f5f5f5",
    },
    headerTitle: { fontWeight: 700, fontSize: 16, color: "#1a1a1a" },
    backBtn: {
        background: "none",
        border: "none",
        color: "#ff5100",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        padding: "4px 0",
        width: 56,
        textAlign: "left",
    },
    body: {
        flex: 1,
        padding: "16px 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflowY: "auto",
    },
    question: { fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: "0 0 18px" },
    label: { fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
    input: {
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: "1.5px solid #e8e8e8",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
    },
    dropdown: {
        position: "absolute",
        background: "#fff",
        border: "1.5px solid #e8e8e8",
        width: "100%",
        maxHeight: 220,
        overflowY: "auto",
        zIndex: 20,
        marginTop: 4,
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    },
    dropdownItem: {
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid #f5f5f5",
        transition: "background 0.15s",
    },
    code: {
        background: "#fff4f0",
        color: "#ff5100",
        fontWeight: 700,
        fontSize: 12,
        padding: "2px 7px",
        borderRadius: 6,
    },
    sub: { fontSize: 12, color: "#999", marginTop: 2 },
    nextBtn: {
        marginTop: "auto",
        height: 46,
        background: "#ff5100",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        transition: "opacity 0.2s",
        marginTop: 20,
    },
    nextBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },
    serviceGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
    },
    serviceCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "20px 12px",
        background: "#fff",
        border: "1.5px solid #e8e8e8",
        borderRadius: 14,
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        fontFamily: "inherit",
    },
    serviceIcon: { fontSize: 30 },
    serviceLabel: { fontWeight: 600, fontSize: 14, color: "#1a1a1a" },
    selectCard: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        background: "#fff",
        border: "1.5px solid #e8e8e8",
        borderRadius: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.2s, background 0.2s",
    },
    selectCardActive: {
        borderColor: "#ff5100",
        background: "#fff4f0",
    },
    check: {
        marginLeft: "auto",
        background: "#ff5100",
        color: "#fff",
        borderRadius: "50%",
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
    },
    cabinCard: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        background: "#fff",
        border: "1.5px solid #e8e8e8",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.2s, background 0.2s",
    },
    cabinCardActive: {
        borderColor: "#ff5100",
        background: "#fff4f0",
    },
    counter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1.5px solid #e0e0e0",
        background: "#fff",
        fontSize: 18,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        transition: "opacity 0.2s",
    },
    divider: { height: 1, background: "#f5f5f5" },
    summaryCard: {
        background: "#fafafa",
        borderRadius: 14,
        padding: "14px 16px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    successIcon: {
        width: 64,
        height: 64,
        background: "#fff4f0",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 30,
    },
};