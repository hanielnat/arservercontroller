import type { ServerCreateFormValues } from "@/types/server";

export const DEFAULT_SERVER_VALUES: ServerCreateFormValues = {
    name: "",
    bindPort: 2001,
    bindAddress: "0.0.0.0",
    a2sPort: 17777,
    rconPort: 19999,
    status: undefined,
    commandLine: ["-logLevel", "spam"],
    environment: undefined,
    extraPorts: undefined,
    reforgerConfig: `{
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
    "admins": [],
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
}
  `,
};
