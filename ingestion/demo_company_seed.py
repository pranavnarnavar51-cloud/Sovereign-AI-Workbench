"""
Demo Company Knowledge Seed - Apex Heavy Dynamics Corp
Pre-seeds rich enterprise documentation, standard operating procedures (SOPs),
personnel directories, and technical specifications into the local memory store.
"""
from stores.knowledge_memory import memory_store

DEMO_DOCUMENTS = [
    {
        "id": "SOP-MNT-101",
        "title": "SOP-MNT-101: Boiler Feed Pump BFP-P-104 Inspection & Vibration Criteria",
        "doc_type": "sop",
        "equipment_tag": "BFP-P-104",
        "tags": "maintenance, pump, vibration, iso10816, bearing",
        "content": (
            "EQUIPMENT: High-Pressure Multi-Stage Boiler Feed Pump (Tag: BFP-P-104)\n"
            "MANUFACTURER: Apex Turbo-Hydraulics | RATED SPEED: 2980 RPM | POWER: 850 kW\n"
            "PURPOSE: Standard operating and condition-monitoring protocol for BFP-P-104.\n"
            "VIBRATION THRESHOLDS (ISO 10816-3 Group 1 Rigid Foundation):\n"
            "- Zone A (< 2.30 mm/s RMS): Newly commissioned / optimal state.\n"
            "- Zone B (2.30 - 4.50 mm/s RMS): Long-term unrestricted continuous operation.\n"
            "- Zone C (4.50 - 7.10 mm/s RMS): Restricted operation; schedule bearing maintenance within 72 hours.\n"
            "- Zone D (> 7.10 mm/s RMS): CRITICAL TRIP ZONE. Immediate staged transfer to Standby Pump P-104B and shutdown.\n"
            "BEARING SPECIFICATIONS:\n"
            "- Drive End (DE): SKF 7318 BECBM Angular Contact Ball Bearing. Max operating temp: 85.0°C.\n"
            "- Non-Drive End (NDE): SKF 6316 Deep Groove Ball Bearing. Max operating temp: 80.0°C.\n"
            "- Lubricant: Synthetic Turbine ISO VG 68 oil. Oil change interval: 3000 running hours.\n"
            "EMERGENCY TRIP OVERRIDE:\n"
            "Tripping BFP-P-104 without opening the minimum flow recirculation valve (FCV-104) is strictly prohibited to prevent cavitation and impeller seizure."
        )
    },
    {
        "id": "SOP-SAF-204",
        "title": "SOP-SAF-204: Lockout/Tagout (LOTO) & Hazardous Energy Isolation",
        "doc_type": "sop",
        "equipment_tag": "ALL-PLANT",
        "tags": "safety, loto, osha, isolation, electrical",
        "content": (
            "STANDARD: OSHA 29 CFR 1910.147 & ISO 45001 Compliance Protocol.\n"
            "APPLICABILITY: Mandatory for all maintenance, servicing, and inspection of plant machinery.\n"
            "SIX-STEP ZERO ENERGY STATE PROCEDURE:\n"
            "1. Preparation & Notification: Notify the Shift Lead Engineer and area operators before isolation.\n"
            "2. Machine Shutdown: Use designated normal stopping procedure at the local control panel.\n"
            "3. Energy Isolation: Disconnect main circuit breaker at MCC-04 and isolate mechanical/hydraulic supply valves.\n"
            "4. Lock & Tag Application: Affix red personalized padlock and Danger Tag to each isolating device. Key must remain with the lead technician.\n"
            "5. Stored Energy Dissipation: Bleed all hydraulic accumulators, vent pressurized steam/air lines to 0.0 bar, and block gravitational hazards.\n"
            "6. Zero Energy Verification: Attempt restart using local start push-button (Bump Test). Confirm 0.0 V with calibrated multimeter. Then return switch to OFF.\n"
            "REMOVAL OF LOCKS:\n"
            "Only the technician who applied the lock may remove it. If the technician is absent, Emergency Removal requires dual authorization from Plant Director M. Sharma and Safety Officer."
        )
    },
    {
        "id": "SOP-ENV-301",
        "title": "SOP-ENV-301: Chemical & Coolant Spill Containment Protocol",
        "doc_type": "sop",
        "equipment_tag": "BAY-2-CHEMICAL",
        "tags": "environment, chemical, coolant, spill, ppe",
        "content": (
            "AREA: Chemical Storage Bay 2 & CNC Machining Cell Coolant Reservoirs.\n"
            "EMERGENCY ACTIONS UPON SPILL DETECTION:\n"
            "1. Evacuate non-essential personnel within 15 meters radius.\n"
            "2. Identify substance from secondary containment label (e.g., Water-Soluble Cutting Coolant ISO 208, Sulfuric Acid Battery Electrolyte, or Synthetic Lubricant ISO VG 68).\n"
            "3. Don Required PPE: Nitrile chemical gloves, chemical splash goggles, rubber safety boots, and Class 3 organic vapor respirator.\n"
            "4. Containment: Deploy absorbent booms from Spill Kit Station 4 (located adjacent to Pillar 14B) to encircle spill and prevent ingress into floor drains.\n"
            "5. Neutralization: For coolant/oil spills, apply particulate absorbent Zeolite powder. Allow 15 minutes contact time, sweep into yellow hazardous waste drum HW-09.\n"
            "6. Incident Notification: Report spill to Safety Officer Ananya Verma (Internal Ext: 2201) within 30 minutes."
        )
    },
    {
        "id": "SOP-ENG-402",
        "title": "SOP-ENG-402: Steam Turbine ST-01 Cold Startup & Temperature Ramp",
        "doc_type": "sop",
        "equipment_tag": "ST-01",
        "tags": "engineering, turbine, steam, startup, thermal",
        "content": (
            "EQUIPMENT: 25 MW Back-Pressure Steam Turbine (Tag: ST-01)\n"
            "TURBINE PARAMETERS: Inlet Steam Pressure: 42.0 bar | Inlet Steam Temp: 420°C | Rated Speed: 3000 RPM\n"
            "STARTUP SEQUENCE:\n"
            "1. Barring Gear Operation: Engage electric barring gear at 120 RPM for minimum 4 hours prior to steam admission to prevent rotor thermal bow.\n"
            "2. Gland Sealing & Vacuum: Admit gland sealing steam at 1.2 bar; establish condenser vacuum at -0.85 bar.\n"
            "3. Casing Warming: Open casing drains. Admit warming steam through bypass valve MV-01. Maintain maximum casing warming rate at 5.0°C per minute to minimize thermal stress.\n"
            "4. Rolling to Critical Speed: Once casing temperature exceeds 180°C, accelerate turbine through first critical resonance zone (1450 - 1650 RPM) without dwell.\n"
            "5. Synchronization: Hold at rated speed 3000 RPM for 15 minutes, check radial shaft vibration (< 28 µm pk-pk), then synchronize generator with plant 11 kV grid.\n"
            "TRIP PROTECTION SETPOINTS: Overspeed trip at 3300 RPM (110%), Lube oil pressure low trip at 1.1 bar, Axial rotor displacement trip at ± 0.65 mm."
        )
    },
    {
        "id": "SOP-QAL-503",
        "title": "SOP-QAL-503: Radiographic & Ultrasonic Weld Inspection Acceptance Criteria",
        "doc_type": "sop",
        "equipment_tag": "FAB-WELD-01",
        "tags": "quality, weld, ndt, asme, radiography",
        "content": (
            "CODE STANDARD: ASME Boiler and Pressure Vessel Code Section IX and Section VIII Div 1 (UW-51 / UW-52).\n"
            "NON-DESTRUCTIVE TESTING (NDT) MANDATE: 100% RT on longitudinal seam welds, 20% spot RT on circumferential girth welds.\n"
            "ACCEPTANCE CRITERIA FOR RADIOGRAPHIC FILMS:\n"
            "- Cracks, Lack of Fusion, Incomplete Penetration: ZERO TOLERANCE (Reject immediately).\n"
            "- Elongated Slag Inclusions: Allowed only if length is <= 6.0 mm for weld thickness t <= 19 mm.\n"
            "- Circular Gas Porosity: Maximum diameter 1.5 mm, maximum 4 pores per 150 mm weld length.\n"
            "- Undercut: Maximum permissible undercut depth is 0.8 mm or 10% of wall thickness, whichever is less.\n"
            "REPAIR PROTOCOL: Weld defects must be gouged out using arc-air gouging, PT verified crack-free, re-welded with E7018-1 electrode, and re-radiographed."
        )
    },
    {
        "id": "DIR-EMP-001",
        "title": "DIR-EMP-001: Apex Heavy Dynamics Enterprise Directory & Emergency Roster",
        "doc_type": "directory",
        "equipment_tag": "PLANT-WIDE",
        "tags": "personnel, shifts, contacts, directory, emergency",
        "content": (
            "COMPANY: Apex Heavy Dynamics Corp - Facility 07 (Mumbai Industrial Zone)\n"
            "EXECUTIVE LEADERSHIP:\n"
            "- Plant Operations Director: Director M. Sharma (Office: Admin Block 401, Ext: 1001, Clearance: LEVEL 5)\n"
            "- Chief Reliability Engineer: Dr. R. Kulkarni (Office: Engg Lab 102, Ext: 1004, Clearance: LEVEL 4)\n"
            "- Head of Plant Safety: Ananya Verma (Office: Safety Command Post, Ext: 2201, Clearance: LEVEL 4)\n"
            "- Lead Quality Assurance Inspector: Priya Nair (Office: QA Lab 3, Ext: 3105, Clearance: LEVEL 3)\n"
            "PLANT SHIFT ROSTER:\n"
            "- Shift A (Morning): 06:00 to 14:00 | Shift Lead: Vikram Rao (Ext: 4401)\n"
            "- Shift B (Evening): 14:00 to 22:00 | Shift Lead: Assigned by roster (Ext: 4402)\n"
            "- Shift C (Night): 22:00 to 06:00 | Shift Lead: Arjun Deshmukh (Ext: 4403)\n"
            "EMERGENCY HOTLINES:\n"
            "- Central Control Room (CCR) Emergency Desk: Internal Ext 9999 / Direct Radio Channel 1\n"
            "- Plant Fire & Hazmat Station: Ext 8888\n"
            "- Plant Medical & First Aid Station: Ext 7777\n"
            "FACILITY ACCESS TIERS:\n"
            "- Level 1: Administrative Staff | Level 2: General Shopfloor Operators | Level 3: Certified Engineers & QA | Level 4: Safety & Plant Heads | Level 5: Plant Director."
        )
    }
]

def seed_company_knowledge():
    """Populate the persistent SQLite database with demo company documentation."""
    for doc in DEMO_DOCUMENTS:
        memory_store.insert_or_update_doc(
            doc_id=doc["id"],
            title=doc["title"],
            doc_type=doc["doc_type"],
            content=doc["content"],
            equipment_tag=doc.get("equipment_tag", ""),
            tags=doc.get("tags", "")
        )
    print(f"[DEMO SEED] Successfully seeded {len(DEMO_DOCUMENTS)} industrial documents for Apex Heavy Dynamics Corp.")

if __name__ == "__main__":
    seed_company_knowledge()
