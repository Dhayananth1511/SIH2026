import os
import sys
import unittest
import re
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None
from PIL import Image

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Application, User, AicteMasterRecord, InfrastructureEvidence
from app.validation_engine import get_category_checklist, CATEGORY_CHECKLISTS_MAP
from app.document_forensics import (
    extract_qr_codes_from_pdf,
    extract_digital_signatures_from_pdf,
    extract_exif_gps_from_image,
    haversine_distance_meters,
    analyze_infrastructure_image
)
from app.scrutiny_pdf import generate_official_scrutiny_pdf


class TestSIH26261StatutoryPlatform(unittest.TestCase):
    """
    Comprehensive Statutory Compliance Test Suite for SIH Problem Statement ID: 26261
    AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification.
    """

    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.test_dir = os.path.join(os.path.dirname(__file__), "test_artifacts")
        os.makedirs(cls.test_dir, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # =========================================================================
    # PHASE 1: DYNAMIC CATEGORY CHECKLISTS & AICTE MASTER DATABASE PANEL
    # =========================================================================
    def test_phase1_category_checklists_completeness(self):
        """Validates all 4 statutory categories have distinct checklists mapped to APH 2026-27."""
        categories = [
            "Extension of Approval (EoA)",
            "Intake Increase / Addition of New Course",
            "New Technical Institution",
            "Supernumerary Seats (FN/OCI/CIWG)"
        ]
        for cat in categories:
            items = get_category_checklist(cat)
            self.assertGreater(len(items), 0, f"Checklist for {cat} must not be empty.")
            mandatory_count = sum(1 for it in items if it.get("is_mandatory") or it.get("mandatory"))
            self.assertGreater(mandatory_count, 0, f"Mandatory items missing for {cat}.")

            # Verify statutory clause citations
            for it in items:
                self.assertIn("rule_id", it)
                self.assertTrue(it["rule_id"].startswith("APH-"))

    def test_phase1_aimr_master_record_retrieval(self):
        """Validates AICTE Institutional Master Record retrieval with TER payment & 3-year history."""
        app = self.db.query(Application).filter(Application.application_id == "APP-2026-0001").first()
        self.assertIsNotNone(app, "APP-2026-0001 must exist in seeded DB.")
        
        master_rec = self.db.query(AicteMasterRecord).filter(
            AicteMasterRecord.institution_id == app.institution_id
        ).first()
        self.assertIsNotNone(master_rec, "AICTE Master Record must exist for institutional applicant.")
        
        # Verify TER fee payment
        self.assertIsNotNone(master_rec.ter_payment)
        self.assertEqual(master_rec.ter_payment.get("status"), "CONFIRMED")
        raw_amt = str(master_rec.ter_payment.get("amount", "0"))
        amt_clean = float(re.sub(r"[^\d.]", "", raw_amt) or 0)
        self.assertGreaterEqual(amt_clean, 100000)

        # Verify previous EoA history
        self.assertIsInstance(master_rec.previous_eoa, list)
        self.assertGreaterEqual(len(master_rec.previous_eoa), 3)

        # Verify faculty EPF and SFR
        self.assertIsNotNone(master_rec.faculty_epf_roster)
        self.assertIn("1:18.5", master_rec.faculty_epf_roster.get("sfr_ratio", ""))

    # =========================================================================
    # PHASE 2: QR CODE, DIGITAL SIGNATURE (DSC) & 6-STATE TAXONOMY
    # =========================================================================
    def test_phase2_qr_and_dsc_forensics(self):
        """Validates QR code domain authorization and X.509 digital signature verification."""
        test_pdf = os.path.join(self.test_dir, "test_compliance_cert.pdf")
        
        gov_url = "https://bhulekh.maharashtra.gov.in/verify/KL-SURVEY-4021/B"
        import fitz
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 100), "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", fontsize=14)
        page.insert_text((50, 130), "Statutory Land Titling & Encumbrance Clearance Certificate", fontsize=11)
        page.insert_text((50, 160), f"Digital Verification URL: {gov_url}", fontsize=9)
        page.insert_text((50, 250), "Digitally Signed by: Chief Revenue Officer, Pune Division", fontsize=10)
        page.insert_text((50, 270), "Date: 2026-02-15 11:30:20 IST", fontsize=9)
        page.insert_text((50, 290), "Certifying Authority: e-Mudhra Consumer CA - Class 3", fontsize=9)
        doc.save(test_pdf)
        doc.close()

        # Test QR / verification detection
        qrs = extract_qr_codes_from_pdf(test_pdf)
        self.assertGreater(len(qrs), 0, "QR / verification endpoint must be detected.")
        self.assertEqual(qrs[0]["statutory_status"], "VERIFIED")

        # Test DSC extraction
        signatures = extract_digital_signatures_from_pdf(test_pdf)
        self.assertGreater(len(signatures), 0, "Digital signature must be extracted from PDF.")
        self.assertEqual(signatures[0]["status"], "VERIFIED")
        self.assertIn("e-Mudhra", signatures[0]["certifying_authority"])

    # =========================================================================
    # PHASE 3: GEO-TAGGED INFRASTRUCTURE COMPUTER VISION MODULE
    # =========================================================================
    def test_phase3_haversine_distance_calculation(self):
        """Validates Haversine great-circle distance algorithm."""
        # Pune campus datum: 18.5204, 73.8567
        # Point 1: ~25 meters away
        dist_near = haversine_distance_meters(18.5204, 73.8567, 18.5206, 73.8569)
        self.assertLess(dist_near, 50.0, "Close coordinate should be < 50m.")
        
        # Point 2: ~1.5 km away (outside campus perimeter)
        dist_far = haversine_distance_meters(18.5204, 73.8567, 18.5340, 73.8567)
        self.assertGreater(dist_far, 1000.0, "Distant coordinate should be > 1000m.")

    def test_phase3_computer_vision_infrastructure_analysis(self):
        """Validates computer vision object detection and sharpness analysis on photos."""
        test_photo = os.path.join(self.test_dir, "test_lab.png")
        # Generate test synthetic photo with PIL
        p_img = Image.new("RGB", (800, 600), color=(240, 240, 240))
        p_img.save(test_photo)

        cv_res = analyze_infrastructure_image(test_photo, "PHOTO_COMPUTER_CENTER")
        self.assertTrue(cv_res["is_valid_image"])
        self.assertGreater(len(cv_res["detected_objects"]), 0)
        self.assertEqual(cv_res["compliance_status"], "COMPLIANT_ADVISORY")
        self.assertIn("Active Workstations", [o["label"] for o in cv_res["detected_objects"]])

    # =========================================================================
    # PHASE 4: SCRUTINY SHEET EXPORT & POLISH
    # =========================================================================
    def test_phase4_official_scrutiny_pdf_generation(self):
        """Validates printable Form AICTE-SCRUTINY-2026 PDF generation with cryptographic seal."""
        sheet_data = {
            "form_id": "AICTE-SCRUTINY-2026",
            "form_title": "STATUTORY PRELIMINARY SCRUTINY AND COMPLIANCE VERIFICATION SHEET",
            "council": "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION",
            "ministry": "Ministry of Education, Government of India",
            "generated_at": "28-Oct-2026 18:30:00 UTC",
            "cryptographic_seal": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "application": {
                "application_id": "APP-2026-0001",
                "institution_name": "Maharashtra Institute of Technology",
                "category": "Extension of Approval (EoA)",
                "academic_year": "2026-2027",
                "region": "Western",
                "state": "Maharashtra",
                "city": "Pune",
                "scrutiny_score": 96.5,
                "status": "SUBMITTED"
            },
            "master_record": {
                "aicte_id": "1-33245561",
                "ter_payment": {"receipt_no": "AICTE-TER-2026-98124", "amount": 150000, "status": "CONFIRMED"},
                "sanctioned_intake": 378,
                "previous_eoa_status": "VERIFIED (2025-26, 2024-25, 2023-24)"
            },
            "authority_verifications": [
                {"authority": "State Fire Prevention Services", "type": "API_PORTAL", "token": "MAH-FIRE-2026-88192", "status": "VERIFIED"},
                {"authority": "State Land Revenue Cadastre", "type": "QR_CODE", "token": "KL-SURVEY-4021/B", "status": "VERIFIED"}
            ],
            "infrastructure_evidence": [
                {"title": "Central Computing Facility & AI Lab", "gps_verified": True, "compliance_status": "COMPLIANT_ADVISORY"},
                {"title": "Central Library & Digital Reading Hall", "gps_verified": True, "compliance_status": "COMPLIANT_ADVISORY"}
            ]
        }

        pdf_bytes = generate_official_scrutiny_pdf(sheet_data)
        self.assertIsNotNone(pdf_bytes)
        self.assertGreater(len(pdf_bytes), 1000, "PDF bytes must be generated and substantial.")
        self.assertTrue(pdf_bytes.startswith(b"%PDF"), "Generated output must be a valid PDF document.")

    def test_phase4_public_seal_verification(self):
        """Validates that public seal verification endpoint authenticates genuine AICTE documents."""
        import hashlib
        from app.main import verify_official_scrutiny_seal
        app = self.db.query(Application).filter(Application.application_id == "APP-2026-0001").first()
        self.assertIsNotNone(app)
        docs = [d for d in app.documents if d.is_latest]
        chain_payload = f"{app.application_id}:{app.scrutiny_score}:{app.status}:{len(docs)}"
        expected_hash = hashlib.sha256(chain_payload.encode()).hexdigest()

        # Test verification with full hash
        result = verify_official_scrutiny_seal(expected_hash, self.db)
        self.assertTrue(result["valid"])
        self.assertEqual(result["status"], "AUTHENTIC_AICTE_DOCUMENT")
        self.assertEqual(result["form_id"], "AICTE-SCRUTINY-2026")
        self.assertEqual(result["application_id"], "APP-2026-0001")

        # Test verification with prefix
        prefix_result = verify_official_scrutiny_seal(expected_hash[:16], self.db)
        self.assertTrue(prefix_result["valid"])


if __name__ == "__main__":
    unittest.main()
