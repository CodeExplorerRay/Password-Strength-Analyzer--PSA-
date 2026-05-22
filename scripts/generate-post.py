#!/usr/bin/env python3

"""
Generate Weekly Security Post
Self-contained Python script that creates markdown posts from templates
Topics: MFA, Authentication, Passwords, Security
"""

import json
import os
import sys
import random
from datetime import datetime
from pathlib import Path

# Content templates for each topic category
TOPIC_TEMPLATES = {
    "passwords": [
        {
            "title": "How to Create Unbreakable Passwords",
            "type": "Guide",
            "description": "Learn the science behind password strength and practical techniques to create passwords that resist brute-force attacks.",
            "keyPoints": [
                "Use length over complexity - 16+ characters beats special characters",
                "Avoid common patterns and dictionary words",
                "Use unique passwords for each account",
                "Consider passphrases for better memorability"
            ]
        },
        {
            "title": "Password Managers: Your First Line of Defense",
            "type": "Tutorial",
            "description": "Discover how password managers work and why they're essential for modern security.",
            "keyPoints": [
                "Centralized encryption keeps your passwords safe",
                "Auto-generate complex, unique passwords",
                "Sync securely across all your devices",
                "Emergency access protocols for loved ones"
            ]
        },
        {
            "title": "The Psychology of Weak Passwords",
            "type": "Analysis",
            "description": "Why do people choose weak passwords despite knowing the risks? Explore the cognitive biases.",
            "keyPoints": [
                "Password fatigue leads to reuse and simplification",
                "Security vs. usability trade-offs",
                "How attackers exploit human nature",
                "Behavioral strategies for better habits"
            ]
        }
    ],
    "mfa": [
        {
            "title": "Multi-Factor Authentication: Beyond the Basics",
            "type": "Deep Dive",
            "description": "Explore different MFA methods and understand which provides the best protection.",
            "keyPoints": [
                "TOTP apps vs. SMS: Security trade-offs",
                "Hardware security keys are the gold standard",
                "Backup codes and recovery options",
                "Implementing MFA across your digital life"
            ]
        },
        {
            "title": "When MFA Fails: Social Engineering Tactics",
            "type": "Security Alert",
            "description": "Even with MFA, attackers have sophisticated techniques. Learn how to stay protected.",
            "keyPoints": [
                "SIM swapping and account takeover methods",
                "Phishing MFA codes and fake verification pages",
                "Push notification approval attacks",
                "Defense strategies and incident response"
            ]
        },
        {
            "title": "MFA Implementation Guide for 2025",
            "type": "Checklist",
            "description": "Step-by-step guide to securing your accounts with multi-factor authentication.",
            "keyPoints": [
                "Critical accounts that need MFA first",
                "Setting up authenticator apps on mobile",
                "Hardware keys for maximum security",
                "Managing recovery codes safely"
            ]
        }
    ],
    "authentication": [
        {
            "title": "The Evolution of Authentication: From Passwords to Passkeys",
            "type": "Opinion",
            "description": "How authentication technology is evolving and what the future holds for securing digital identity.",
            "keyPoints": [
                "Passwordless authentication is becoming reality",
                "FIDO2 and WebAuthn standards",
                "Biometric authentication and privacy concerns",
                "Transition strategies for organizations"
            ]
        },
        {
            "title": "OAuth and Third-Party Authentication Risks",
            "type": "Security Analysis",
            "description": "When you 'Sign in with Google,' what data is shared? Understand the risks.",
            "keyPoints": [
                "Data permissions and privacy implications",
                "Account linking vulnerabilities",
                "Rogue applications exploiting OAuth",
                "Safe practices for third-party authentication"
            ]
        },
        {
            "title": "Zero Trust Authentication: The Future of Access Control",
            "type": "Enterprise Guide",
            "description": "Modern security requires abandoning trust and verifying everything.",
            "keyPoints": [
                "Never trust, always verify principles",
                "Continuous authentication and risk assessment",
                "Device health checks and compliance",
                "Implementing zero trust in your organization"
            ]
        }
    ],
    "security": [
        {
            "title": "Your Digital Security Audit: A Complete Checklist",
            "type": "Checklist",
            "description": "Comprehensive security assessment to identify and fix vulnerabilities.",
            "keyPoints": [
                "Inventory all your online accounts",
                "Check breach status on HaveIBeenPwned",
                "Enable MFA on critical services",
                "Update security settings on all platforms"
            ]
        },
        {
            "title": "Data Breach Response: What to Do When Attacked",
            "type": "Guide",
            "description": "A practical guide for the immediate aftermath of a security breach.",
            "keyPoints": [
                "Immediate containment and damage assessment",
                "Changing passwords and securing accounts",
                "Monitoring for identity theft",
                "Legal and compliance obligations"
            ]
        },
        {
            "title": "Security Fatigue: How to Stay Protected Without Burnout",
            "type": "Wellness",
            "description": "Balancing comprehensive security with mental health and usability.",
            "keyPoints": [
                "Prioritize your highest-risk accounts",
                "Automate what you can",
                "Use tools to reduce decision fatigue",
                "Regular but reasonable security practices"
            ]
        }
    ]
}


def get_today_date():
    """Get today's date in YYYY-MM-DD format"""
    return datetime.now().strftime("%Y-%m-%d")


def generate_filename(title):
    """Generate filename from title"""
    filename = title.lower()
    filename = ''.join(c if c.isalnum() or c in '-_ ' else '' for c in filename)
    filename = filename.replace(' ', '-')
    filename = filename[:50]
    return filename


def get_all_topics():
    """Get list of all available topics"""
    return list(TOPIC_TEMPLATES.keys())


def select_topic_for_week():
    """Select topic based on week number (deterministic rotation)"""
    topics = get_all_topics()
    week_number = int(datetime.now().timestamp() / (7 * 24 * 60 * 60))
    return topics[week_number % len(topics)]


def generate_markdown(template, topic):
    """Generate markdown content from template"""
    date = get_today_date()
    key_points_list = "\n".join(f"- {point}" for point in template["keyPoints"])

    markdown = f"""---
title: "{template['title']}"
date: "{date}"
tags: ['{topic}', 'security']
type: "{template['type']}"
description: "{template['description']}"
thumbnail: "/static/images/posts/{generate_filename(template['title'])}.png"
status: "draft"
scheduled: true
---

### Introduction
{template['description']}

In this article, we explain the core ideas and practical takeaways for staying secure.

### Key Insights
{key_points_list}

### Conclusion
{template['title']} - practical security guidance for SecurePass users. Use SecurePass to test and improve your password strength, and implement these strategies across your digital life.

### Next Steps
1. Assess your current approach
2. Identify one area to improve this week
3. Use SecurePass to validate your security measures
"""

    return markdown


def generate_post(topic_override=None):
    """Generate a weekly post"""
    try:
        # Select topic (override or rotate)
        topic = topic_override or select_topic_for_week()

        if topic not in TOPIC_TEMPLATES:
            raise ValueError(
                f"Unknown topic: {topic}. Available: {', '.join(get_all_topics())}"
            )

        # Select random template for the topic
        template = random.choice(TOPIC_TEMPLATES[topic])

        # Generate markdown
        markdown = generate_markdown(template, topic)

        # Create filename
        filename = f"{generate_filename(template['title'])}.md"

        # Ensure directory exists
        publish_dir = Path(__file__).parent.parent / "content" / "2025" / "published"
        publish_dir.mkdir(parents=True, exist_ok=True)

        # Write file
        file_path = publish_dir / filename
        file_path.write_text(markdown, encoding="utf-8")

        print(f"✅ Post generated successfully!")
        print(f"📝 Title: {template['title']}")
        print(f"🏷️  Topic: {topic}")
        print(f"📅 Date: {get_today_date()}")
        print(f"📂 Location: {file_path}")

        return {
            "success": True,
            "filename": filename,
            "filepath": str(file_path),
            "title": template["title"],
            "topic": topic,
            "date": get_today_date(),
        }

    except Exception as error:
        print(f"❌ Error generating post: {str(error)}", file=sys.stderr)
        sys.exit(1)


def main():
    """CLI execution"""
    topic_arg = sys.argv[1] if len(sys.argv) > 1 else None
    result = generate_post(topic_arg)
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
