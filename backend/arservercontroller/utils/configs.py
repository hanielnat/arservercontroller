from arservercontroller.constants import directory_manager


def make_default_server_config(name: str = "base") -> tuple[bool, Exception | None]:
    config = """{
    "rcon": {
        "address": "0.0.0.0",
        "port": 18787,
        "password": "rcon",
        "permission": "monitor",
        "blacklist": [],
        "whitelist": []
    },
    "game": {
        "name": "Test ARServer",
        "password": "arserver",
        "passwordAdmin": "arserver",
        "admins" : [],
        "scenarioId": "{2BBBE828037C6F4B}Missions/22_GM_Arland.conf",
        "maxPlayers": 128,
        "visible": true,
        "gameProperties": {
            "serverMaxViewDistance": 1600,
            "serverMinGrassDistance": 50,
            "networkViewDistance": 1500,
            "fastValidation": true,
            "battlEye": true
        },
        "mods": [
            {
                "modId": "5965550F24A0C152",
                "name": "Where Am I",
                "version": "1.2.0"
            }
        ]
    }
}"""

    config_path = (
        directory_manager.controller_directories.DS_CONFIGS_DIR / f"{name}.json"
    )

    try:
        with open(config_path, "w") as f:
            f.write(config)
    except (IOError, OSError) as e:
        return (False, e)

    return (True, None)
