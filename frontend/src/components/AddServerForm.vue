<script setup lang="ts">
import consts from "@/lib/consts";
import {
    ServerConfig,
    ServerConfigCreate,
    serverConfigCreateSchema,
    ServerStatusEnum,
} from "@/lib/types";
import { useServersStore } from "@/stores/useServersStore";
import { Form, FormField, FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import {
    Button,
    Fieldset,
    FloatLabel,
    InputNumber,
    InputText,
    Message,
    Toast,
} from "primevue";
import { reactive, ref, shallowRef, watch } from "vue";

const emit = defineEmits<{
    submitted: [serverId: string, data: Record<string, any>];
    fetching: [isFetching: boolean];
}>();

const defaultCreatedConfig: ServerConfigCreate = {
    name: "test-server",
    bindPort: 2001,
    bindAddress: "0.0.0.0",
    a2sPort: 17777,
    rconPort: 19999,
    commandLine: "-logLevel spam",
    environment: [["KEY", "VALUE"]],
    extraPorts: [["1234/tcp", 1234]],
};

const defaultConfig: ServerConfig = {
    ...defaultCreatedConfig,
    id: consts._NULL_UUID,
    containerId: consts._NULL_UUID,
    status: ServerStatusEnum.dead,
};

interface FormEntry {
    id: string;
    label: string;
    placeholder: string;
    description: string | null;
    isRequired: boolean;
    isNumberField: boolean;
}

interface FormFieldGroup {
    fieldGroupName: string;
    children: FormEntry[];
}

const { createServer, isLoading } = useServersStore();
const resolver = ref(zodResolver(serverConfigCreateSchema));
const currentServerId = shallowRef<string | null>(consts._NULL_UUID);
let configState = reactive(defaultConfig);

watch(
    () => isLoading,
    (val) => {
        emit("fetching", val);
    },
);

const fields = ref<FormFieldGroup[]>([
    {
        fieldGroupName: "Required",
        children: [
            {
                id: "name",
                label: "Server Name",
                placeholder: "test-server",
                description: null,
                isRequired: true,
                isNumberField: false,
            },
            {
                id: "bindPort",
                label: "Bind Port",
                placeholder: "2001",
                description: "Arma Rreforger Server bind port.",
                isRequired: true,
                isNumberField: true,
            },
        ],
    },
    {
        fieldGroupName: "Ports",
        children: [
            {
                id: "a2sPort",
                label: "A2S Port",
                placeholder: "17777",
                description: "A2S protocol bind port.",
                isRequired: false,
                isNumberField: true,
            },
            {
                id: "rconPort",
                label: "RCON Port",
                placeholder: "19999",
                description: "RCON protocol bind port.",
                isRequired: false,
                isNumberField: true,
            },
            {
                id: "bindAddress",
                label: "Bind Address",
                placeholder: "0.0.0.0",
                description:
                    "IPv4 address that the server will listen to ('0.0.0.0' gets the address automatically).",
                isRequired: false,
                isNumberField: false,
            },
        ],
    },
    {
        fieldGroupName: "Advanced",
        children: [
            {
                id: "commandLine",
                label: "Command Line",
                placeholder: "-logLevel spam",
                description: "Arma Reforger Server extra startup parameters.",
                isRequired: false,
                isNumberField: false,
            },
            {
                id: "environment",
                label: "Environment Variables",
                description:
                    "Extra environment variables passed to the docker container.",
                placeholder: "",
                isRequired: false,
                isNumberField: false,
            },
            {
                id: "extraPorts",
                label: "Extra Ports",
                description:
                    "Extra ports to open passed to the docker container.",
                placeholder: "",
                isRequired: false,
                isNumberField: false,
            },
        ],
    },
]);

async function onFormSubmit(event: FormSubmitEvent) {
    if (!event.valid) {
        console.error("Invalid add server form submit event");
        return;
    }

    const payload: ServerConfigCreate = {
        name: event.values.name,
        bindPort: event.values.bindPort,
        bindAddress: event.values.bindAddress,
        a2sPort: event.values.a2sPort,
        rconPort: event.values.rconPort,
        commandLine: event.values.commandLine,
        environment: event.values.environment,
        extraPorts: event.values.extraPorts,
    };

    configState.name = payload.name;
    configState.bindPort = payload.bindPort;
    configState.bindAddress = payload.bindAddress;
    configState.a2sPort = payload.a2sPort;
    configState.rconPort = payload.rconPort;
    configState.commandLine = payload.commandLine;
    configState.environment = payload.environment;
    configState.extraPorts = payload.extraPorts;

    const data = await createServer(payload);

    if (data) {
        currentServerId.value = data.id ?? consts._NULL_UUID;
        console.debug("Will emit (submitted)", event.values);
        emit("submitted", currentServerId.value!, event.values);
    }
}
</script>

<template>
    <section>
        <Toast />
        <Form
            v-slot="$form"
            v-model="configState"
            :resolver="resolver"
            @submit="onFormSubmit"
        >
            <div class="flex justify-end w-full">
                <Message
                    class="my-auto p-4"
                    variant="simple"
                    :icon="!$form?.valid ? 'pi pi-times-circle' : 'pi pi-check'"
                    :severity="!$form?.valid ? 'error' : 'info'"
                    fluid
                >
                    {{ $form?.valid ? "Form valid" : "Form invalid" }}
                </Message>

                <Button
                    type="submit"
                    label="Submit"
                    size="small"
                    :severity="$form?.valid ? 'primary' : 'secondary'"
                    :icon="$form?.valid ? 'pi pi-check' : 'pi pi-times'"
                    :disabled="($form?.valid ? false : true) || isLoading"
                    :loading="isLoading"
                    class="m-4 mr-0"
                />
            </div>

            <Fieldset
                v-for="(entry, entryIndex) of fields"
                style="margin-bottom: 16px"
                :key="entryIndex"
                :legend="entry.fieldGroupName"
                :toggleable="true"
            >
                <FormField
                    v-for="(fieldEntry, fieldIndex) of entry.children"
                    v-slot="$field"
                    class="p-8"
                    :key="fieldIndex"
                    :name="fieldEntry.id"
                >
                    <FloatLabel>
                        <InputText
                            v-if="!fieldEntry.isNumberField"
                            :name="fieldEntry.id"
                            :placeholder="fieldEntry.placeholder"
                            :inputId="fieldEntry.id"
                            :required="fieldEntry.isRequired"
                            size="large"
                            variant="filled"
                            fluid
                        />

                        <InputNumber
                            v-else
                            :name="fieldEntry.id"
                            :placeholder="fieldEntry.placeholder"
                            :inputId="fieldEntry.id"
                            :required="fieldEntry.isRequired"
                            size="large"
                            variant="filled"
                            fluid
                        />

                        <label :for="fieldEntry.id">{{
                            fieldEntry.label
                        }}</label>

                        <Message
                            size="small"
                            severity="secondary"
                            variant="simple"
                        >
                            {{ fieldEntry.description }}
                        </Message>

                        <Message
                            v-if="$field?.invalid"
                            severity="error"
                            size="small"
                            variant="simple"
                            class="mt-4"
                        >
                            {{ $field.error?.message }}
                        </Message>
                    </FloatLabel>
                </FormField>
            </Fieldset>
        </Form>
    </section>
</template>
