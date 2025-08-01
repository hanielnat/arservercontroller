# Agent Guidelines for ARServerController

This document outlines the conventions and commands for agentic coding in this repository.

## 1. Build/Lint/Test Commands

- **Build**: No explicit build command found.
- **Lint**: No explicit lint command found.
- **Test**:
    - To run all tests: `pytest`
    - To run a single test file: `pytest tests/test_file_name.py`
    - To run a specific test within a file: `pytest tests/test_file_name.py::test_function_name`

## 2. Code Style Guidelines (Python)

- **Imports**: Follow PEP 8 guidelines for imports (e.g., standard library, third-party, local application imports, each in separate blocks).
- **Formatting**: Adhere to PEP 8 for code formatting (e.g., 4-space indentation, line length).
- **Types**: Use type hints for function arguments and return values where appropriate.
- **Naming Conventions**: Follow PEP 8 naming conventions (e.g., `snake_case` for functions and variables, `CamelCase` for classes).
- **Error Handling**: Use `try-except` blocks for explicit error handling.

## 3. Agent-Specific Rules

- No Cursor rules (`.cursor/rules/` or `.cursorrules`) found.
- No Copilot rules (`.github/copilot-instructions.md`) found.
