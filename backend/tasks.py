#!/usr/bin/env python3
"""
Project tasks script, similar to a Makefile.
Usage: uv run tasks <command>  (e.g., uv run tasks lint)
"""

import argparse
import os
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Callable

SCRIPT_PATH: str = str(Path(__file__).parent.resolve())
ROOT_PATH: str = str(Path(SCRIPT_PATH).parent.resolve())

ENV: dict[str, str] = {"UV_LINK_MODE": os.getenv("UV_LINK_MODE") or "copy"}
"""Environment to be passed to task commands."""


def has_tool(path: str) -> tuple[str, bool]:
    """Check if a provided tool/binary is installed in the system and available in $PATH."""
    found = shutil.which(path)
    if found:
        return found, True

    print(f"Error finding {path} in $PATH, exiting...")
    return "", False


def run_command(
    cmd: str,
    /,
    args: str | list[str],
    cwd: str | None = SCRIPT_PATH,
    shell: bool = False,
    capture_output: bool = False,
) -> bool:
    """Run a subprocess command and handle errors."""
    cmd_path, found_cmd = has_tool(cmd)
    if not found_cmd:
        return False

    if isinstance(args, str):
        args = f"{cmd_path} {args}"
    else:
        args.insert(0, cmd_path)

    try:
        result = subprocess.run(
            args,
            env=ENV,
            cwd=cwd,
            shell=shell,
            check=True,
            capture_output=capture_output,
            text=True,
        )
        if not capture_output and result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        if not capture_output:
            if e.stdout:
                print(e.stdout)
            if e.stderr:
                print(e.stderr, file=sys.stderr)
        print(
            f"Command '{args if isinstance(args, str) else ' '.join(args)}' failed with exit code {e.returncode}",
            file=sys.stderr,
        )
        return False


# fmt: off
TASKS: dict[str, Callable[[], bool]] = {
    "clean":             lambda: TASKS["clean-venv"]() and run_command(
                            "bash",
                            [
                                "-c",
                                textwrap.dedent(
                                    """rm -rf .pytest_cache dist .eggs .ruff_cache .mypy_cache
                                    .coverage *.egg-info build */build .idea *.swp *.swo .DS_Store Thumbs.db
                                    && find . -type d -name '__pycache__' -exec rm -rf {} +"""
                                ),
                            ],
                            cwd=ROOT_PATH,
    ),

    "clean-venv":        lambda: run_command(
                            "bash",
                            [
                                "-c",
                                textwrap.dedent(
                                    """rm -rf .venv venv */venv */.venv"""
                                ),
                            ],
    ),

    "clean-app-data":    lambda: run_command("bash", ["-c", "rm -rf data/"]),

    "venv":              lambda: TASKS["clean-venv"]() and run_command(
                            "uv",
                            ["venv", "--prompt", "arservercontroller", ".venv"],
    ),

    "install":           lambda: TASKS["venv"]() and run_command(
                            "uv",
                            ["sync", "--all-groups", "--reinstall", "--compile-bytecode"],
    ),

    "lint":              lambda: (
                            run_command("uv", ["run", "ruff", "check", "."])
                            and run_command("uv", ["run", "mypy", "."])
    ),

    "format":            lambda: run_command("uv", ["run", "ruff", "format", "."]),

    "test":              lambda: run_command("uv", ["run", "pytest"]),

    "check":             lambda: TASKS["lint"]() and TASKS["test"](),

    "coverage":          lambda: run_command(
                            "uv",
                            ["run", "pytest", "--cov", "--cov-report=html"],

    ),

    "pre-commit":        lambda: (
                            run_command("uv", ["run", "pre-commit", "install"])
                            and run_command("uv", ["run", "pre-commit", "run", "--all-files"])
    ),

    "run-dev":           lambda: run_command(
                            "uv",
                            ["run", "fastapi", "dev"],
                            cwd=f"{SCRIPT_PATH}/arservercontroller",
    ),

    "run":               lambda: run_command(
                            "uv",
                            ["run", "fastapi", "run"],
                            cwd=f"{SCRIPT_PATH}/arservercontroller",
    ),

    "migrate":           lambda: run_command(
                            "uv",
                            ["run", "alembic", "upgrade", "head"],
    ),

    "build-dockerfiles": lambda: TASKS["install"]() and run_command(
                            "bash",
                            ["-c", "build-image.sh"],
    ),
}
# fmt: on


def main() -> int:
    parser = argparse.ArgumentParser(description="Project tasks like a Makefile.")
    parser.add_argument(
        "command", nargs="?", help="Task to run (e.g., lint, format, test)"
    )
    parser.add_argument(
        "--help-tasks", action="store_true", help="List available tasks"
    )

    args = parser.parse_args()

    if args.help_tasks:
        print("Available tasks:")
        for task in sorted(TASKS.keys()):
            print(f"  {task}")
        return 0

    success: bool = False
    if not args.command:
        args.command = "install"

    if args.command not in TASKS:
        print(f"Unknown command: {args.command}")
        print("Use --help-tasks to list available tasks.")
        return 1

    success = TASKS[args.command]()
    return 0 if success else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        pass
