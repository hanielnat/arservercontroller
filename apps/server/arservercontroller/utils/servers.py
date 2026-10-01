def make_command_line(
    server_name: str,
    bind_port: int,
    a2s_port: int | None,
    extra: list[str] | None,
) -> list[str]:
    out = [
        "-logVoting",
        "-disableCrashReporter",
        "-freezeCheckMode",
        "kill",
        "-bindPort",
        str(bind_port),
    ]

    if a2s_port:
        out.extend(
            [
                "-a2sPort",
                str(a2s_port),
            ]
        )

    out.extend(
        [
            "-profile",
            f"/home/{server_name}",
            "-config",
            f"/home/{server_name}/config.json",
        ]
    )

    if extra:
        out.extend(extra)

    return out
