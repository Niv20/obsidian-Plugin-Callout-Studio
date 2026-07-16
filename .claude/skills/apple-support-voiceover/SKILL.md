---
name: apple-support-voiceover
description: >-
    Use when writing voiceover scripts for software or plugin tutorial videos
    in the "Apple Support" YouTube style — ultra-concise, calm, authoritative
    narration stripped of conversational fluff. Triggers: "voiceover script",
    "tutorial narration", "Apple Support style", "video script".
---

# Skill: Apple Support-Style Voiceover Scripting

## Overview

This skill defines the rules, tone, structure, and verbal phrasing required to write ultra-concise, high-clarity voiceover scripts for software and plugin tutorials. The objective is to replicate the "Apple Support" YouTube video style: approachable, authoritative, calm, and completely stripped of conversational fluff.

---

## 1. Core Voice & Tone Principles

- **Calm & Conversational Authority:** Speak at eye level. The tone should be reassuring, professional, and effortless.
- **Radical Conciseness:** Every single word must serve a purpose. If a word does not help the user complete the action or understand the immediate benefit, delete it.
- **Active Voice & Imperative Mood:** Always command the action directly in the present tense. Never use future tense, conditional phrasing, or passive voice.
- **One Action Per Sentence:** Never chain multiple instructions together with words like "and then," "after that," or "once you've done that." Let one sentence guide one physical action, followed by a pause.

---

## 2. Script Structure (What to Say)

### Phase 1: The Hook (The Value Proposition)

- **Goal:** State the end result or user benefit immediately in a single sentence, then transition directly into the tutorial.
- **Formula:** _[Rhetorical question or benefit statement]? Here is how to [action] with [Plugin Name]._
- **Example:** "Want to create and customize visual callouts in your notes? Here’s how to get started with Callout Studio."

### Phase 2: Navigation & Setup

- **Goal:** Get the user to the starting line (settings, menu, or main interface) in under 10 words.
- **Formula:** _Open [Menu/App], and select [Tab/Option]._
- **Example:** "Open your settings, and navigate to the Community Plugins tab."

### Phase 3: The Core Features (Action $\rightarrow$ Outcome)

- **Goal:** Guide the user through 2–3 core features using a strict cause-and-effect verbal structure.
- **Formula:** _To [achieve outcome], click [UI Element]._ OR _Select [Option] to [apply effect]._
- **Example:** "To change the default icon, click the icon library and select your preferred style."
- **Example:** "Type the trigger command directly into your editor, and choose a layout from the quick menu."

### Phase 4: The Outro (Clean Wrap-Up)

- **Goal:** Conclude the tutorial immediately after the final action is demonstrated. Point to documentation for advanced needs.
- **Formula:** _[Short concluding statement]. For more helpful guides and advanced settings, visit [Documentation/Website]._
- **Example:** "That’s all it takes to customize your workspace. For more guides and detailed documentation, visit our official repository."

---

## 3. What NOT to Say (The Anti-Patterns)

- **NO YouTube Filler or Social Begging:**
    - ❌ "Hey guys, welcome back to my channel! Today I'm super excited to show you..."
    - ❌ "If you found this video helpful, don't forget to smash that like button and subscribe!"
- **NO Passive or Future Tense Phrasing:**
    - ❌ "Next, you are going to want to go ahead and click on the settings icon..."
    - ❌ "Once that is clicked by you, a dropdown menu will be opened."
    - ✔️ **Correction:** "Click the settings icon to open the dropdown menu."
- **NO Technical Over-Explaining:**
    - ❌ "The plugin now asynchronously parses your custom CSS snippets to render the DOM elements without blocking the main thread."
    - ✔️ **Correction:** "Your custom styles apply instantly as you type."
- **NO Apologetic or Hedging Language:**
    - ❌ "This might seem a bit complicated at first, but try to follow along..."
    - ❌ "Hopefully, this helps you fix the issue."

---

## 4. Phrasing & Grammar Rules

### The "Trim the Fat" Rule

Always edit sentences to remove introductory padding and filler verbs.

- _Draft:_ "So the first thing that you need to do is just open up the preferences menu."
- _Final Script:_ "Open the preferences menu."

### The Vocabulary Guide

Use consistent, simple terminology for digital interactions:

- Use **"Click"** for buttons, links, and icons.
- Use **"Select"** or **"Choose"** for dropdown menus, lists, and checkboxes.
- Use **"Type"** or **"Enter"** for text input fields.
- Use **"Navigate to"** or **"Go to"** for switching tabs or pages.

### Pacing and Pauses (Script Formatting for Eleven Multilingual v2)

When formatting the script for ElevenLabs Multilingual v2, **never use text brackets like `[pause]**`, as the model may read them aloud or glitch. Instead, use a two-tiered system to control the rhythm and audio timing:

- **Action Pauses (SSML Breaks):** To give the viewer time to watch an action occur on screen between steps, end the sentence with a period, drop to a new line, and insert an explicit SSML break tag. Use `<break time="1.0s" />` for standard UI interactions and `<break time="1.5s" />` for major scene transitions.
- **Natural Breath Pauses (Double Hyphens):** For a subtle, conversational half-second pause or breath within a sentence without breaking the authoritative rhythm, use double hyphens surrounded by spaces (`--`).
- **Example:**
  "To change the default icon, click the icon library -- and select your preferred style.

Type the trigger command directly into your editor -- and choose a layout from the quick menu."

---

## 5. Output & Handoff (Required — Do Not Skip)

The voiceover script is **not** the final deliverable on its own. This skill always ends with two mandatory steps:

1. **Save the script.** Create the `video-scripts/` folder at the project root if it doesn't already exist. Save the finished script to `video-scripts/<slug>.md` (kebab-case slug of the video's topic/title) under a `## Voiceover Script` heading.
2. **Immediately hand off to `apple-visual-annotator`.** Right after saving the script, invoke the `apple-visual-annotator` skill against this same file — do not stop and wait, and do not consider the task done until the visual annotation pass has run. `apple-visual-annotator` cannot run without this script existing first, so this handoff is what unblocks it.
