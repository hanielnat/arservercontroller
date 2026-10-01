<script setup lang="ts">
import AddServerForm from "@/components/AddServerForm.vue";
import ServerCreationLogs from "@/components/ServerCreationLogs.vue";
import { Step, StepList, Stepper } from "primevue";
import { computed, ref } from "vue";

type StepperStep = "form" | "logs" | "done";

const currentStep = ref<StepperStep>("form");
const createdServerId = ref<string>("0");
const formData = ref<Record<string, any> | null>(null);
const isFormFetching = ref(false);

const stepLabels: { label: string; value: StepperStep }[] = [
    { label: "Server Info", value: "form" },
    { label: "Status", value: "logs" },
    { label: "Overview", value: "done" },
];

const activeIndex = computed(() => {
    return stepLabels.findIndex((s) => s.value === currentStep.value);
});

function onFormSubmitted(serverId: string, data: Record<string, any>) {
    createdServerId.value = serverId;
    formData.value = data;
    currentStep.value = "logs";
}

function onCreationFinished() {
    currentStep.value = "done";
}
</script>

<template>
    <section class="flex flex-col">
        <h1>Create a Server</h1>

        <div class="ml-80 mr-80">
            <Stepper
                :value="activeIndex"
                class="basis-auto pointer-events-none"
            >
                <StepList>
                    <Step
                        v-for="step in stepLabels"
                        :key="step.value"
                        :value="stepLabels.indexOf(step)"
                    >
                        {{ step.label }}
                    </Step>
                </StepList>
            </Stepper>

            <div v-show="currentStep === 'form'" class="mt-6">
                <AddServerForm
                    @fetching="isFormFetching = $event"
                    @submitted="onFormSubmitted"
                />
            </div>

            <div v-if="currentStep === 'logs'" class="mt-6">
                <ServerCreationLogs
                    :is-fetching="isFormFetching"
                    :server-id="createdServerId"
                    @finished="onCreationFinished"
                />
            </div>

            <div v-if="currentStep === 'done'" class="mt-6">
                <h2 class="text-lg font-medium mb-4">Server Created</h2>

                <div v-if="formData" class="border rounded p-4">
                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
                        <template v-for="(val, key) in formData" :key="key">
                            <dt class="font-medium capitalize">
                                {{ key }}
                            </dt>

                            <dd class="text-muted-color">
                                {{
                                    Array.isArray(val)
                                        ? JSON.stringify(val)
                                        : (val ?? "—")
                                }}
                            </dd>
                        </template>
                    </dl>
                </div>
            </div>
        </div>
    </section>
</template>
