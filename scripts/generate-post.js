#!/usr/bin/env node

/**
 * Generate Weekly Security Post
 * Self-contained script that creates markdown posts from templates
 * Topics: MFA, Authentication, Passwords, Security
 */

const fs = require('fs');
const path = require('path');

// Content templates for each topic category
const topicTemplates = {
  passwords: [
    {
      title: "How to Create Unbreakable Passwords",
      type: "Guide",
      description: "Learn the science behind password strength and practical techniques to create passwords that resist brute-force attacks.",
      keyPoints: [
        "Use length over complexity - 16+ characters beats special characters",
        "Avoid common patterns and dictionary words",
        "Use unique passwords for each account",
        "Consider passphrases for better memorability"
      ]
    },
    {
      title: "Password Managers: Your First Line of Defense",
      type: "Tutorial",
      description: "Discover how password managers work and why they're essential for modern security.",
      keyPoints: [
        "Centralized encryption keeps your passwords safe",
        "Auto-generate complex, unique passwords",
        "Sync securely across all your devices",
        "Emergency access protocols for loved ones"
      ]
    },
    {
      title: "The Psychology of Weak Passwords",
      type: "Analysis",
      description: "Why do people choose weak passwords despite knowing the risks? Explore the cognitive biases.",
      keyPoints: [
        "Password fatigue leads to reuse and simplification",
        "Security vs. usability trade-offs",
        "How attackers exploit human nature",
        "Behavioral strategies for better habits"
      ]
    }
  ],
  mfa: [
    {
      title: "Multi-Factor Authentication: Beyond the Basics",
      type: "Deep Dive",
      description: "Explore different MFA methods and understand which provides the best protection.",
      keyPoints: [
        "TOTP apps vs. SMS: Security trade-offs",
        "Hardware security keys are the gold standard",
        "Backup codes and recovery options",
        "Implementing MFA across your digital life"
      ]
    },
    {
      title: "When MFA Fails: Social Engineering Tactics",
      type: "Security Alert",
      description: "Even with MFA, attackers have sophisticated techniques. Learn how to stay protected.",
      keyPoints: [
        "SIM swapping and account takeover methods",
        "Phishing MFA codes and fake verification pages",
        "Push notification approval attacks",
        "Defense strategies and incident response"
      ]
    },
    {
      title: "MFA Implementation Guide for 2025",
      type: "Checklist",
      description: "Step-by-step guide to securing your accounts with multi-factor authentication.",
      keyPoints: [
        "Critical accounts that need MFA first",
        "Setting up authenticator apps on mobile",
        "Hardware keys for maximum security",
        "Managing recovery codes safely"
      ]
    }
  ],
  authentication: [
    {
      title: "The Evolution of Authentication: From Passwords to Passkeys",
      type: "Opinion",
      description: "How authentication technology is evolving and what the future holds for securing digital identity.",
      keyPoints: [
        "Passwordless authentication is becoming reality",
        "FIDO2 and WebAuthn standards",
        "Biometric authentication and privacy concerns",
        "Transition strategies for organizations"
      ]
    },
    {
      title: "OAuth and Third-Party Authentication Risks",
      type: "Security Analysis",
      description: "When you 'Sign in with Google,' what data is shared? Understand the risks.",
      keyPoints: [
        "Data permissions and privacy implications",
        "Account linking vulnerabilities",
        "Rogue applications exploiting OAuth",
        "Safe practices for third-party authentication"
      ]
    },
    {
      title: "Zero Trust Authentication: The Future of Access Control",
      type: "Enterprise Guide",
      description: "Modern security requires abandoning trust and verifying everything.",
      keyPoints: [
        "Never trust, always verify principles",
        "Continuous authentication and risk assessment",
        "Device health checks and compliance",
        "Implementing zero trust in your organization"
      ]
    }
  ],
  security: [
    {
      title: "Your Digital Security Audit: A Complete Checklist",
      type: "Checklist",
      description: "Comprehensive security assessment to identify and fix vulnerabilities.",
      keyPoints: [
        "Inventory all your online accounts",
        "Check breach status on HaveIBeenPwned",
        "Enable MFA on critical services",
        "Update security settings on all platforms"
      ]
    },
    {
      title: "Data Breach Response: What to Do When Attacked",
      type: "Guide",
      description: "A practical guide for the immediate aftermath of a security breach.",
      keyPoints: [
        "Immediate containment and damage assessment",
        "Changing passwords and securing accounts",
        "Monitoring for identity theft",
        "Legal and compliance obligations"
      ]
    },
    {
      title: "Security Fatigue: How to Stay Protected Without Burnout",
      type: "Wellness",
      description: "Balancing comprehensive security with mental health and usability.",
      keyPoints: [
        "Prioritize your highest-risk accounts",
        "Automate what you can",
        "Use tools to reduce decision fatigue",
        "Regular but reasonable security practices"
      ]
    }
  ]
};

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to generate filename from title
function generateFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Helper function to select random item
function selectRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get all topics
function getAllTopics() {
  return Object.keys(topicTemplates);
}

// Helper function to rotate topics (simple week-based rotation)
function selectTopicForWeek() {
  const topics = getAllTopics();
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return topics[weekNumber % topics.length];
}

// Generate markdown content from template
function generateMarkdown(template, topic) {
  const date = getTodayDate();
  const keyPointsList = template.keyPoints
    .map(point => `- ${point}`)
    .join('\n');

  const markdown = `---
title: "${template.title}"
date: "${date}"
tags: ['${topic}', 'security']
type: "${template.type}"
description: "${template.description}"
thumbnail: "/static/images/posts/${generateFilename(template.title)}.png"
status: "draft"
scheduled: true
---

### Introduction
${template.description}

In this article, we explain the core ideas and practical takeaways for staying secure.

### Key Insights
${keyPointsList}

### Conclusion
${template.title} - practical security guidance for SecurePass users. Use SecurePass to test and improve your password strength, and implement these strategies across your digital life.

### Next Steps
1. Assess your current approach
2. Identify one area to improve this week
3. Use SecurePass to validate your security measures
`;

  return markdown;
}

// Main generation function
function generatePost(topicOverride = null) {
  try {
    // Select topic (override or rotate)
    const topic = topicOverride || selectTopicForWeek();
    
    if (!topicTemplates[topic]) {
      throw new Error(`Unknown topic: ${topic}. Available: ${getAllTopics().join(', ')}`);
    }

    // Select random template for the topic
    const template = selectRandom(topicTemplates[topic]);
    
    // Generate markdown
    const markdown = generateMarkdown(template, topic);
    
    // Create filename
    const filename = `${generateFilename(template.title)}.md`;
    
    // Ensure directory exists
    const publishDir = path.join(__dirname, '..', 'content', '2025', 'published');
    if (!fs.existsSync(publishDir)) {
      fs.mkdirSync(publishDir, { recursive: true });
    }
    
    // Write file
    const filePath = path.join(publishDir, filename);
    fs.writeFileSync(filePath, markdown, 'utf-8');
    
    console.log(`✅ Post generated successfully!`);
    console.log(`📝 Title: ${template.title}`);
    console.log(`🏷️  Topic: ${topic}`);
    console.log(`📅 Date: ${getTodayDate()}`);
    console.log(`📂 Location: ${filePath}`);
    
    return {
      success: true,
      filename,
      filepath: filePath,
      title: template.title,
      topic,
      date: getTodayDate()
    };
  } catch (error) {
    console.error(`❌ Error generating post: ${error.message}`);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const topicArg = process.argv[2];
  const result = generatePost(topicArg);
  process.exit(result.success ? 0 : 1);
}

module.exports = { generatePost, getAllTopics, getTodayDate };
