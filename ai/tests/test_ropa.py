"""
Unit and integration tests for Tandem AI / ROPA Engine.
"""

import unittest
from ai.ropa_service import analyze_transcript, deterministic_extract_intelligence
from ai.llm_service import extract_project_intelligence
from ai.schemas import validate_project_intelligence


class TestRopaService(unittest.TestCase):
    def test_checkpoint_1_transcript(self):
        """
        Verify the Checkpoint 1 test transcript:
        - Decision: PostgreSQL
        - Task: Database schema -> Rahul
        - Task: API -> Manit
        - Risk: Authentication integration delay
        """
        transcript = (
            "Let's use PostgreSQL.\n"
            "Rahul will build the database schema.\n"
            "Manit will implement the API.\n"
            "The authentication integration may be delayed."
        )

        result = analyze_transcript(transcript)

        # 1. Verify schema completeness
        self.assertIn("decisions", result)
        self.assertIn("tasks", result)
        self.assertIn("risks", result)
        self.assertIn("unresolved", result)

        # 2. Verify Decision
        self.assertTrue(len(result["decisions"]) >= 1)
        dec_titles = [d["title"].lower() for d in result["decisions"]]
        self.assertTrue(any("postgresql" in t for t in dec_titles))
        for d in result["decisions"]:
            self.assertIn(d["status"], ["confirmed", "proposed", "superseded"])
            self.assertGreaterEqual(d["confidence"], 0.0)
            self.assertLessEqual(d["confidence"], 1.0)
            self.assertTrue(d["id"].startswith("dec_"))

        # 3. Verify Tasks
        self.assertEqual(len(result["tasks"]), 2)
        task_map = {t["owner"]: t["title"] for t in result["tasks"]}
        self.assertIn("Rahul", task_map)
        self.assertIn("Manit", task_map)

        # 4. Verify Risk
        self.assertTrue(len(result["risks"]) >= 1)
        risk_titles = [r["title"].lower() for r in result["risks"]]
        self.assertTrue(any("authentication integration" in t for t in risk_titles))
        self.assertEqual(result["risks"][0]["severity"], "medium")

    def test_test1_explicit_decision(self):
        """
        TEST 1: Explicit decision directly agreed upon.
        """
        transcript = (
            'Rahul: "I think PostgreSQL makes more sense because our data is relational."\n'
            'Priya: "Agreed. Let\'s use PostgreSQL."'
        )
        result = analyze_transcript(transcript)

        self.assertTrue(len(result["decisions"]) >= 1)
        decision = result["decisions"][0]
        self.assertIn("postgresql", decision["title"].lower())
        self.assertEqual(decision["status"], "confirmed")
        self.assertGreaterEqual(decision["confidence"], 0.8)
        self.assertEqual(len(result["unresolved"]), 0)

    def test_test2_tasks_with_owners(self):
        """
        TEST 2: Tasks with owners identified.
        """
        transcript = (
            'Manit: "I\'ll handle the API."\n'
            'Rahul: "I\'ll implement the database schema."\n'
            'Priya will design the UI components.'
        )
        result = analyze_transcript(transcript)

        self.assertEqual(len(result["tasks"]), 3)
        owners = {t["owner"] for t in result["tasks"]}
        self.assertIn("Manit", owners)
        self.assertIn("Rahul", owners)
        self.assertIn("Priya", owners)
        for task in result["tasks"]:
            self.assertIn(task["status"], ["todo", "in_progress", "done"])
            self.assertTrue(task["id"].startswith("task_"))

    def test_test3_ambiguous_discussion_unresolved(self):
        """
        TEST 3: Ambiguous discussion where no final decision was made.
        Example:
        "Maybe MongoDB could work.
        I'm not sure.
        Let's discuss this tomorrow."

        Expected:
        NOT Decision: MongoDB selected
        INSTEAD: Unresolved item (status: open)
        """
        transcript = (
            "Maybe MongoDB could work.\n"
            "I'm not sure.\n"
            "Let's discuss this tomorrow."
        )
        result = analyze_transcript(transcript)

        # Must NOT contain a confirmed decision for MongoDB
        self.assertEqual(len(result["decisions"]), 0)

        # Must contain an unresolved open item
        self.assertTrue(len(result["unresolved"]) >= 1)
        unresolved = result["unresolved"][0]
        self.assertEqual(unresolved["status"], "open")
        self.assertTrue("mongodb" in unresolved["title"].lower() or "database" in unresolved["title"].lower() or "discussion" in unresolved["title"].lower())

    def test_empty_transcript(self):
        """Empty transcript should return valid empty collections, not error."""
        result = analyze_transcript("")
        self.assertEqual(result, {
            "decisions": [],
            "tasks": [],
            "risks": [],
            "unresolved": [],
        })

    def test_llm_fallback_resilience(self):
        """When LLM API fails or is offline, fallback returns valid intelligence without crashing."""
        transcript = "Let's use PostgreSQL. Manit will implement the API."
        # Invoke with use_llm=True (which attempts LLM and falls back to deterministic)
        result = analyze_transcript(transcript, use_llm=True)

        self.assertIn("decisions", result)
        self.assertIn("tasks", result)
        self.assertTrue(any("postgresql" in d["title"].lower() for d in result["decisions"]))
        self.assertTrue(any(t["owner"] == "Manit" for t in result["tasks"]))


if __name__ == "__main__":
    unittest.main()
