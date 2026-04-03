<script lang="ts" setup>
import { Form, FormField, FormSubmitEvent } from "@primevue/forms"
import { zodResolver } from "@primevue/forms/resolvers/zod"
import { useFetch } from "@vueuse/core"
import { Button, InputText } from "primevue"
import { onUnmounted, reactive, ref, shallowRef } from "vue"
import * as z from "zod"
import ServerCreationLogs from "../components/ServerCreationLogs.vue"
import { useApi } from "../composables/useApi"

const _PORT_MAX = 65535
const _PORT_MIN = 0
const _NULL_UUID = "00000000-0000-0000-0000-000000000000"

const serverConfigCreateSchema = z.object({
    serverName: z.string(),
    bindPort: z.int().gt(_PORT_MIN).lt(_PORT_MAX),
    bindAddress: z.ipv4().default("0.0.0.0"),
    a2sPort: z.nullable(z.int().gt(_PORT_MIN).lt(_PORT_MAX)),
    rconPort: z.nullable(z.int().gt(_PORT_MIN).lt(_PORT_MAX)),
    commandLine: z.nullable(z.string()),
    environment: z.nullable(z.array(z.tuple([z.string(), z.string()]))),
    extraPorts: z.nullable(z.array(z.tuple([z.string(), z.int()]))),
})

const serverConfigSchema = serverConfigCreateSchema.extend({
    id: z.uuidv4(),
    containerId: z.string(),
})

type ServerConfigCreate = z.infer<typeof serverConfigCreateSchema>
type ServerConfig = z.infer<typeof serverConfigSchema>

const defaultCreatedConfig: ServerConfigCreate = {
    serverName: "test-server",
    bindPort: 2001,
    bindAddress: "0.0.0.0",
    a2sPort: 17777,
    rconPort: 19999,
    commandLine: "-logLevel spam",
    environment: [["KEY", "VALUE"]],
    extraPorts: [["1234/tcp", 1234]],
}

const defaultConfig: ServerConfig = {
    ...defaultCreatedConfig,
    id: _NULL_UUID,
    containerId: _NULL_UUID,
}

enum ServerCreationStage
{
    NONE,
    DONE,
    PREPARE,
    IMAGE_PUSH,
    CREATE_CONTAINER,
}

const { apiUrl } = useApi()
const resolver = ref(zodResolver(serverConfigCreateSchema))
const configInput = reactive(defaultConfig)
const currentStage = shallowRef(ServerCreationStage.NONE)
const logs = ref<string[]>([])
const creationProgress = shallowRef(0)
const currentServerId = shallowRef<string | null>(_NULL_UUID)
const configResult = ref<ServerConfig | null>(configInput)

// async function submitForm(event: FormSubmitEvent)
async function submitForm()
{
    // console.log(event.values as ServerConfig)
    console.log("submitForm()")
    return

    currentStage.value = ServerCreationStage.PREPARE
    creationProgress.value = 10

    console.log(configInput.serverName)

    const { data, error, response } = useFetch(apiUrl("/servers"), {
        method: "POST",
    })
        .post(JSON.stringify(configInput))
        .json<ServerConfig>()

    if (error.value)
    {
        logs.value.push("Error creating server")
        console.error(error.value)
        currentStage.value = ServerCreationStage.NONE
        return
    }

    console.debug(
        "Server creation request sent to backend, response:",
        response.value?.json,
    )

    currentServerId.value = data.value?.id ?? _NULL_UUID
    configResult.value = data.value
}

onUnmounted(() =>
{})
</script>

<template>
    <div class="flex-1 p-3 overflow-x-hidden">
        <div class="w-auto">
            <div class="p-6">
                <Form
                    v-slot="$form"
                    v-model="configInput"
                    :resolver="resolver"
                    class=""
                    @submit="
                        ;(ev: FormSubmitEvent) =>
                            ev.originalEvent.preventDefault()
                        submitForm()
                    "
                >
                    <FormField v-slot="$field" name="serverName" class="m-3">
                        <label for="inputServerName">Server Name</label>
                        <InputText
                            name="inputServerName"
                            placeholder="Enter server name"
                            required
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="bindPort" class="m-3">
                        <label for="inputBindPort">Bind Port</label>
                        <InputText
                            name="inputBindPort"
                            placeholder="2001"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="bindAddress" class="m-3">
                        <label for="inputBindAddress">Bind Address</label>
                        <InputText
                            name="inputBindAddress"
                            placeholder="0.0.0.0"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="a2sPort" class="m-3">
                        <label for="inputA2sPort">A2S Port</label>
                        <InputText
                            name="inputA2sPort"
                            placeholder="17777"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="rconPort" class="m-3">
                        <label for="inputRconPort">RCON Port</label>
                        <InputText
                            name="inputRconPort"
                            placeholder="19999"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="commandLine" class="m-3">
                        <label for="inputCommandLine">Command Line</label>
                        <InputText
                            name="inputCommandLine"
                            placeholder="-logLevel spam"
                            fluid
                        />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="environment" class="m-3">
                        <label for="inputEnvironment">Environment</label>
                        <InputText name="inputEnvironment" fluid />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <FormField v-slot="$field" name="extraPorts" class="m-3">
                        <label for="inputExtraPorts">Extra Ports</label>
                        <InputText name="inputExtraPorts" fluid />
                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FormField>

                    <Button
                        type="submit"
                        label="Submit"
                        size="small"
                        :severity="$form?.valid ? 'primary' : 'secondary'"
                        :icon="$form?.valid ? 'pi pi-check' : 'pi pi-times'"
                        :disabled="$form?.valid ? false : true"
                        class="m-3"
                        fluid
                    />
                </Form>
            </div>

            <ServerCreationLogs
                v-if="currentServerId !== _NULL_UUID"
                :server-id="currentServerId ?? _NULL_UUID"
            />

            <!-- <Card
                class="p-6"
                :class="{
                    'opacity-50 pointer-events-none': currentStage !== 0,
                }"
            >
                <template #title>
                    <h2 class="text-2xl font-bold mb-4">Add Server</h2>
                </template>

                <template #content>
                    <form @submit.prevent="submitForm" class="space-y-4">
                        <div>
                            <label
                                for="server-name"
                                class="block text-sm font-medium mb-1"
                                >Server Name</label
                            >
                            <InputText
                                id="server-name"
                                v-model="serverName"
                                placeholder="Enter server name"
                                class="w-full"
                                required
                            />
                        </div>

                        <div>
                            <label
                                for="bind-port"
                                class="block text-sm font-medium mb-1"
                                >Bind Port</label
                            >
                            <InputNumber
                                id="bind-port"
                                v-model="bindPort"
                                placeholder="2001"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label
                                for="bind-address"
                                class="block text-sm font-medium mb-1"
                                >Bind Address</label
                            >
                            <InputText
                                id="bind-address"
                                v-model="bindAddress"
                                placeholder="0.0.0.0"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label
                                for="a2s-port"
                                class="block text-sm font-medium mb-1"
                                >A2S Port</label
                            >
                            <InputNumber
                                id="a2s-port"
                                v-model="a2sPort"
                                placeholder="17777"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label
                                for="rcon-port"
                                class="block text-sm font-medium mb-1"
                                >RCON Port</label
                            >
                            <InputNumber
                                id="rcon-port"
                                v-model="rconPort"
                                placeholder="19999"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label
                                for="command-line"
                                class="block text-sm font-medium mb-1"
                                >Command Line</label
                            >
                            <InputText
                                id="command-line"
                                v-model="commandLine"
                                placeholder="Optional command line"
                                class="w-full"
                            />
                        </div>

                        <Button
                            type="submit"
                            label="Add Server"
                            class="mt-4 w-full"
                            :disabled="currentStage !== 0"
                        />
                    </form>
                </template>
            </Card> -->

            <!-- <Card class="p-6">
                <template #title>
                    <h2 class="text-2xl font-bold mb-4">
                        <span v-if="currentStage === 0">Creation Status</span>
                        <span v-else-if="currentStage === 1"
                            >Creating Server...</span
                        >
                        <span v-else>Server Created!</span>
                    </h2>
                </template>

                <template #content>
                    <div
                        v-if="currentStage === 0"
                        class="flex flex-col items-center justify-center h-full text-muted-color"
                    >
                        <i class="pi pi-server text-4xl mb-4"></i>
                        <p>
                            Configure your server and click "Add Server" to
                            begin the creation process.
                        </p>
                    </div>

                    <div v-else-if="currentStage === 1" class="space-y-4">
                        <ProgressBar :value="creationProgress"></ProgressBar>
                        <div
                            class="bg-emphasis p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto"
                        >
                            <div
                                v-for="(log, index) in logs"
                                :key="index"
                                class="mb-1 text-primary"
                            >
                                <span class="opacity-50"
                                    >[{{
                                        new Date().toLocaleTimeString()
                                    }}]</span
                                >
                                {{ log }}
                            </div>
                        </div>
                    </div>

                    <div v-else-if="currentStage === 2" class="space-y-6">
                        <div
                            class="flex items-center gap-3 text-green-500 font-bold text-xl"
                        >
                            <i class="pi pi-check-circle"></i>
                            Success!
                        </div>

                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="font-semibold">Server Name:</div>
                            <div>{{ serverName }}</div>

                            <div class="font-semibold">Bind Port:</div>
                            <div>{{ bindPort }}</div>

                            <div class="font-semibold">Bind Address:</div>
                            <div>{{ bindAddress }}</div>

                            <div class="font-semibold">A2S Port:</div>
                            <div>{{ a2sPort }}</div>

                            <div class="font-semibold">RCON Port:</div>
                            <div>{{ rconPort }}</div>
                        </div>

                        <Button
                            label="Go to Dashboard"
                            class="w-full mt-4"
                            @click="$router.push('/')"
                        />
                    </div>
                </template>
            </Card> -->
        </div>
    </div>
</template>
