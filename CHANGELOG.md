# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-08-05

### Added

- Added `orchestrator` as a separately installable skill with Codex UI metadata.

### Changed

- Repositioned the public repository as `Martin-Kocev/skills` and added a separate catalog entry and install command for every skill.
- Made repository validation discover skill directories and require each discovered package to appear in the public README.

## [1.0.1] - 2026-08-04

### Fixed

- Replaced pre-publication owner placeholders with the canonical GitHub source and skills.sh badge.

## [1.0.0] - 2026-08-04

### Added

- Public multi-skill repository packaging for `interactive-codebase-atlas` and `gitflow-feature-workflow`.
- Dependency-free repository, atlas-template, and progress-store validation.
- GitHub Actions validation for public contributions.
- skills.sh-compatible installation and publication documentation.
