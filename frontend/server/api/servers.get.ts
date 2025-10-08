import { SERVERS } from "~/lib/constants"

export default eventHandler(async () =>
{
    const ret = { count: SERVERS.length, data: SERVERS }
    console.log("GET:", ret)
    return ret
})
