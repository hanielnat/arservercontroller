import random
import sys
import time

lines = [
    "SERVER  player connected 127.0.0.1(playerId=1)\n",
    "  RPL  registering player with rplId: 0x0001\n",
    "SERVER  player disconnected(playerId=1)\n",
    "  ENTITY  Creating player {12AB7F58}/Prefabs/core/PlayerController_Base.et\n",
]

try:
    sys.stdout.write(
        f"CORE  starting ArmaReforgerServer mock with arguments '{sys.argv}'\n"
    )
    sys.stdout.flush()

    index = 0
    for _ in range(99):
        sleep_for = random.randint(0, 2)

        sys.stdout.write(lines[index])
        sys.stdout.flush()

        index = random.randint(0, len(lines) - 1)
        time.sleep(float(sleep_for))

    print("CORE  stopping ArmaReforgerServer mock")
except KeyboardInterrupt:
    print("CORE  stopping ArmaReforgerServer mock")
    sys.exit()
