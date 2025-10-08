import { SERVERS } from "~/lib/constants"

export default eventHandler(async (event) =>
{
    const body = await readBody(event)
    const id = body?.id
    const status = body?.status

    await new Promise(resolve => setTimeout(resolve, 5000))

    const found = SERVERS.find(server => server.id === id
    )
    if (!found)
    {
        throw createError({
            statusCode: 404,
            message: "Not found."
        })
    }

    found.id = id
    found.status = status

    console.log("POST:", found)
    return found
})
